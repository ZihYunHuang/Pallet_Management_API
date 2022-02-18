const prisma = require('../services/prismaClientService');
let documentService = require('../services/documentService');
const { success, fail } = require('../services/reponseService');


const discardController = {
    newDiscardDocument: async (req, res) => {
        // 取得有報廢權限的廠商
        const mainSupplier = await prisma.supplier.findFirst({
            where: {
                flag: 'M'
            }
        });

        // 將 req 的 pallet_type_id 改為 type (配合前端所需 json 格式)
        req.body.discard_detail.forEach(element => {
            element.type = element.pallet_type_id;
            delete element.pallet_type_id;
        });

        // 判斷所有借出棧板均為在庫棧板
        const palletInventory = documentService.checkAllPalletInventory(mainSupplier.warehouse_id, req.body.discard_detail);
        palletInventory.then((inventory) => {
            if (inventory) {
                // 取得流水碼
                let dateStr = new Date(req.body.discard_date).toISOString().substring(0, 10).replace(/-/g, '');
                const sequenceNumber = documentService.getSequenceNumber(dateStr, req.body.program_id);
                sequenceNumber.then(async function (returnObj) {
                    // req 的 discard_detail 加上 creator_user(for insert discard_detail)
                    req.body.discard_detail.forEach(element => {
                        element.creator_user = req.body.creator_user;
                    });

                    try {
                        // 建立報廢單
                        const createDiscard = prisma.discard.create({
                            data: {
                                discard_id: returnObj.sequenceNumber,
                                reason: req.body.reason,
                                remark: req.body.remark,
                                discard_date: new Date(req.body.discard_date),
                                creator_user: req.body.creator_user,
                                discard_detail: {
                                    create: req.body.discard_detail
                                }
                            }
                        });

                        // palletData for update pallet、supplier_pallet_detail
                        let palletData = [];
                        req.body.discard_detail.forEach(element => {
                            palletData.push({
                                type: element.type,
                                pallet_id: element.pallet_id
                            });
                        });

                        // 更新棧板狀態
                        const updatePallet = prisma.pallet.updateMany({
                            where: {
                                OR: palletData
                            },
                            data: {
                                discard_status: true,
                                modifier_user: req.body.creator_user,
                                modified_date: new Date(),
                                modified_time: new Date()
                            }
                        });

                        // 流水碼 +1 
                        const progEncodingUpdate = prisma.prog_encoding.update({
                            where: {
                                program_id_constvalue: {
                                    program_id: req.body.program_id,
                                    constvalue: dateStr
                                }
                            },
                            data: {
                                now_num: returnObj.nowNum + 1
                            }
                        });

                        // 更新廠商棧板明細
                        const supplierPalletDetailUpdate = prisma.supplier_pallet_detail.updateMany({
                            where: {
                                OR: palletData
                            },
                            data: {
                                flag: 'D',
                                modifier_user: req.body.creator_user,
                                modified_date: new Date(),
                                modified_time: new Date()
                            }
                        });

                        await prisma.$transaction([createDiscard, updatePallet, progEncodingUpdate, supplierPalletDetailUpdate]);

                        success(res, 201, null);
                    } catch (error) {
                        console.log(error);
                        fail(res, 417, error);
                    }
                });
            } else {
                // 部分棧板不在庫
                fail(res, 400, '400.2');
            }
        });
    },
    getDiscardDocument: async (req, res) => {
        // where 條件(包含搜尋)
        const searchObj = {
            AND: [
                {
                    flag: ''
                },
                {
                    OR: [
                        {
                            discard_id: {
                                contains: req.body.search
                            }
                        },
                        {
                            reason: {
                                contains: req.body.search
                            }
                        },

                        // 搜尋棧板
                        {
                            discard_detail: {
                                some: {
                                    OR: [
                                        {
                                            type: {
                                                contains: req.body.search
                                            },
                                        },
                                        {
                                            pallet_id: {
                                                contains: req.body.search
                                            }
                                        },
                                        {
                                            AND: [
                                                {
                                                    type: {
                                                        contains: (req.body.search).charAt(0)
                                                    },
                                                },
                                                {
                                                    pallet_id: {
                                                        contains: (req.body.search).slice(1)
                                                    },
                                                }
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    ]
                }
            ]
        };

        try {
            const discardDocument = await prisma.discard.findMany({
                skip: 10 * (req.body.page - 1),
                take: 10,
                where: searchObj,
                select: {
                    discard_id: true,
                    discard_date: true,
                    reason: true,
                    remark: true,
                    discard_detail: {
                        select: {
                            type: true,
                            pallet_id: true,
                            pallet: {
                                select: {
                                    pallet_type: {
                                        select: {
                                            pallet_type_name: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    discard_id: 'desc'
                }
            });

            discardDocument.forEach(element => {
                element.discard_date = element.discard_date.toISOString().substring(0, 10);
                element.pallet = {};
                element.discard_detail.forEach(detail => {
                    if (element.pallet[detail.type] == undefined) {
                        /* 在 element 新增如下物件
                            {
                                'P': {
                                    'pallet_type_name': '木棧板',
                                    'pallet_type_id': 'W',
                                    'pallet_id': []
                                }
                            }
                         */
                        element.pallet[detail.type] = {
                            'pallet_type_name': detail.pallet.pallet_type.pallet_type_name,
                            'pallet_type_id': detail.type,
                            'pallet_id': []
                        }
                    }

                    element.pallet[detail.type].pallet_id.push(detail.pallet_id);
                });

                delete element.discard_detail;

                // 將物件忽略key值轉為陣列(將先前新增的物件配合前端所需json格式轉為陣列)
                /* 
                    [
                        {
                            'pallet_type_name': '木棧板',
                            'pallet_type_id': 'W',
                            'pallet_id': []
                        }
                    ]
                 */
                element.pallet = Object.values(element.pallet);
            });

            success(res, 200, discardDocument);
        } catch (error) {
            console.log(error);
            fail(res, 417, error);
        }
    },
    deleteDiscardDocument: async (req, res) => {
        try {
            // 刪除報廢單
            const discardUpdate = prisma.discard.update({
                where: {
                    discard_id: req.body.discard_id
                },
                data: {
                    flag: 'D',
                    modifier_user: req.body.modifier_user,
                    modified_date: new Date(),
                    modified_time: new Date(),
                    discard_detail: {
                        updateMany: {
                            where: {
                                flag: '',
                            },
                            data: {
                                flag: 'D',
                                modifier_user: req.body.modifier_user,
                                modified_date: new Date(),
                                modified_time: new Date(),
                            }
                        }
                    }
                }
            });

            const discard = await prisma.discard.findFirst({
                where: {
                    discard_id: req.body.discard_id
                },
                select: {
                    discard_detail: {
                        select: {
                            pallet_id: true,
                            type: true
                        }
                    }
                }
            });

            const discardPallet = discard.discard_detail;

            // 將棧板 discard_status 改為 false
            const palletUpdate = prisma.pallet.updateMany({
                where: {
                    OR: discardPallet
                },
                data: {
                    discard_status: false,
                    modifier_user: req.body.modifier_user,
                    modified_date: new Date(),
                    modified_time: new Date(),
                }
            });

            // 將廠商棧板明細 flag 改為 ''
            const supplierPalletDetailUpdate = prisma.supplier_pallet_detail.updateMany({
                where: {
                    OR: discardPallet
                },
                data: {
                    flag: '',
                    modifier_user: req.body.modifier_user,
                    modified_date: new Date(),
                    modified_time: new Date(),
                }
            });

            await prisma.$transaction([discardUpdate, palletUpdate, supplierPalletDetailUpdate]);

            success(res, 200, null);
        } catch (error) {
            console.log(error);
            fail(res, 417, error);
        }
    }
}

module.exports = discardController;
