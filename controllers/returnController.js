const prisma = require('../services/prismaClientService');
let documentService = require('../services/documentService');
const { success, fail } = require('../services/reponseService');


const returnController = {
    newReturnDocument: async (req, res) => {
        // 將 req 的 pallet_type_id 改為 type (配合前端所需 json 格式)
        req.body.pallet_return_detail.forEach(element => {
            element.type = element.pallet_type_id;
            delete element.pallet_type_id;
        });

        // 判斷所有歸還棧板均為在庫棧板
        const palletInventory = documentService.checkAllPalletInventory(req.body.source_warehouse_id, req.body.pallet_return_detail);
        palletInventory.then((inventory) => {
            if (inventory) {
                // 取得流水碼
                let dateStr = new Date(req.body.return_date).toISOString().substring(0, 10).replace(/-/g, '');
                const sequenceNumber = documentService.getSequenceNumber(dateStr, req.body.program_id);
                sequenceNumber.then(async function (returnObj) {
                    // req 的 pallet_return_detail 加上 creator_user(for insert pallet_return_detail)
                    req.body.pallet_return_detail.forEach(element => {
                        element.creator_user = req.body.creator_user;
                    });

                    try {
                        // 建立借出單
                        const createPalletReturn = prisma.pallet_return.create({
                            data: {
                                return_id: returnObj.sequenceNumber,
                                source_warehouse_id: req.body.source_warehouse_id,
                                destination_warehouse_id: req.body.destination_warehouse_id,
                                return_date: new Date(req.body.return_date),
                                remark: req.body.remark,
                                creator_user: req.body.creator_user,
                                pallet_return_detail: {
                                    create: req.body.pallet_return_detail
                                }
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

                        // palletData for update supplier_pallet_detail
                        let palletData = [];
                        req.body.pallet_return_detail.forEach(element => {
                            palletData.push({
                                type: element.type,
                                pallet_id: element.pallet_id
                            });
                        });

                        // 更新廠商棧板明細
                        const updateSupplierPalletDetail = prisma.supplier_pallet_detail.updateMany({
                            where: {
                                OR: palletData
                            },
                            data: {
                                warehouse_id: req.body.destination_warehouse_id,
                                modifier_user: req.body.creator_user,
                                modified_date: new Date(),
                                modified_time: new Date()
                            }
                        });

                        await prisma.$transaction([createPalletReturn, updateSupplierPalletDetail, progEncodingUpdate]);

                        success(res, 201, null);
                    } catch (error) {
                        console.log(error)
                        fail(res, 417, error);
                    }
                });
            } else {
                // 部分棧板不在庫
                fail(res, 400, '400.2');
            }
        });
    },
    getReturnDocument: async (req, res) => {
        // where 條件(包含搜尋)
        const searchObj = {
            AND: [
                {
                    flag: ''
                },
                {
                    OR: [
                        // 搜尋歸還單號
                        {
                            return_id: {
                                contains: req.body.search
                            }
                        },

                        // 搜尋廠商名稱
                        {
                            supplier_pallet_return_destination_warehouse_idTosupplier: {
                                warehouse_name: {
                                    contains: req.body.search
                                }
                            }
                        },
                        {
                            supplier_pallet_return_source_warehouse_idTosupplier: {
                                warehouse_name: {
                                    contains: req.body.search
                                }
                            }
                        },

                        // 搜尋棧板
                        {
                            pallet_return_detail: {
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
            const palletReturn = await prisma.pallet_return.findMany({
                skip: 10 * (req.body.page - 1),
                take: 10,
                where: searchObj,
                select: {
                    return_id: true,
                    source_warehouse_id: true,
                    destination_warehouse_id: true,
                    return_date: true,
                    remark: true,
                    supplier_pallet_return_destination_warehouse_idTosupplier: {
                        select: {
                            warehouse_name: true
                        }
                    },
                    supplier_pallet_return_source_warehouse_idTosupplier: {
                        select: {
                            warehouse_name: true
                        }
                    },
                    pallet_return_detail: {
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
                    return_id: 'desc'
                }
            });

            palletReturn.forEach(element => {
                element.return_date = element.return_date.toISOString().substring(0, 10);
                element.source_warehouse_name = element.supplier_pallet_return_source_warehouse_idTosupplier.warehouse_name;
                element.destination_warehouse_name = element.supplier_pallet_return_destination_warehouse_idTosupplier.warehouse_name;
                delete element.supplier_pallet_return_source_warehouse_idTosupplier;
                delete element.supplier_pallet_return_destination_warehouse_idTosupplier;

                element.pallet = {};
                element.pallet_return_detail.forEach(detail => {
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

                delete element.pallet_return_detail;

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

            success(res, 200, palletReturn);
        } catch (error) {
            console.log(error);
            fail(res, 417, error);
        }
    },
    deleteReturnDocument: async (req, res) => {
        try {
            // 取得原歸還單的 1.來源庫別 2.目的庫別 3.歸還棧板
            const palletReturnDocument = await prisma.pallet_return.findFirst({
                where: {
                    return_id: req.body.return_id
                },
                select: {
                    source_warehouse_id: true,
                    destination_warehouse_id: true,
                    pallet_return_detail: {
                        select: {
                            type: true,
                            pallet_id: true
                        }
                    }
                }
            });

            // 判斷所有棧板均為 目的庫別 的在庫棧板
            const palletInventory = documentService.checkAllPalletInventory(palletReturnDocument.destination_warehouse_id, palletReturnDocument.pallet_return_detail);
            palletInventory.then(async (inventory) => {
                if (inventory) {
                    const palletReturnUpdate = prisma.pallet_return.update({
                        where: {
                            return_id: req.body.return_id
                        },
                        data: {
                            flag: 'D',
                            modifier_user: req.body.modifier_user,
                            modified_date: new Date(),
                            modified_time: new Date(),
                            pallet_return_detail: {
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

                    const palletReturn = await prisma.pallet_return.findFirst({
                        where: {
                            return_id: req.body.return_id
                        },
                        select: {
                            pallet_return_detail: {
                                select: {
                                    pallet_id: true,
                                    type: true
                                }
                            }
                        }
                    });

                    // 將棧板歸回原本的廠商
                    const updateSupplierPalletDetail = prisma.supplier_pallet_detail.updateMany({
                        where: {
                            OR: palletReturn.pallet_return_detail
                        },
                        data: {
                            warehouse_id: palletReturnDocument.source_warehouse_id,
                            modifier_user: req.body.modifier_user,
                            modified_date: new Date(),
                            modified_time: new Date(),
                        }
                    });

                    await prisma.$transaction([palletReturnUpdate, updateSupplierPalletDetail]);

                    success(res, 200, null);
                } else {
                    // 部分棧板不在庫
                    fail(res, 400, '400.2');
                }
            })
        } catch (error) {
            console.log(error);
            fail(res, 417, error);
        }

    }
}

module.exports = returnController;