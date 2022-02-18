const prisma = require('../services/prismaClientService');
let documentService = require('../services/documentService');
const { success, fail } = require('../services/reponseService');


const lendController = {
    newLendDocument: async (req, res) => {
        // 將 req 的 pallet_type_id 改為 type (配合前端所需 json 格式)
        req.body.pallet_lend_detail.forEach(element => {
            element.type = element.pallet_type_id;
            delete element.pallet_type_id;
        });

        // 判斷所有借出棧板均為在庫棧板
        const palletInventory = documentService.checkAllPalletInventory(req.body.source_warehouse_id, req.body.pallet_lend_detail);
        palletInventory.then((inventory) => {
            if (inventory) {
                // 取得流水碼
                let dateStr = new Date(req.body.lend_date).toISOString().substring(0, 10).replace(/-/g, '');
                const sequenceNumber = documentService.getSequenceNumber(dateStr, req.body.program_id);
                sequenceNumber.then(async function (returnObj) {
                    // req 的 pallet_lend_detail 加上 creator_user(for insert pallet_lend_detail)
                    req.body.pallet_lend_detail.forEach(element => {
                        element.creator_user = req.body.creator_user;
                    });

                    try {
                        // 建立借出單
                        const createPalletLend = prisma.pallet_lend.create({
                            data: {
                                lend_id: returnObj.sequenceNumber,
                                source_warehouse_id: req.body.source_warehouse_id,
                                destination_warehouse_id: req.body.destination_warehouse_id,
                                order_number: req.body.order_number,
                                lend_date: new Date(req.body.lend_date),
                                remark: req.body.remark,
                                creator_user: req.body.creator_user,
                                pallet_lend_detail: {
                                    create: req.body.pallet_lend_detail
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
                        req.body.pallet_lend_detail.forEach(element => {
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

                        await prisma.$transaction([createPalletLend, updateSupplierPalletDetail, progEncodingUpdate]);

                        success(res, 201, null);
                    } catch (error) {
                        console.log(error)
                        fail(res, 417, error);
                    }
                })
            } else {
                // 部分棧板不在庫
                fail(res, 400, '400.2');
            }
        });
    },
    getLendDocument: async (req, res) => {
        // where 條件(包含搜尋)
        const searchObj = {
            AND: [
                {
                    flag: ''
                },
                {
                    OR: [
                        // 搜尋借出單號
                        {
                            lend_id: {
                                contains: req.body.search
                            }
                        },

                        // 搜尋 order_number
                        {
                            order_number: {
                                contains: req.body.search
                            }
                        },

                        // 搜尋廠商名稱
                        {
                            supplier_pallet_lend_destination_warehouse_idTosupplier: {
                                warehouse_name: {
                                    contains: req.body.search
                                }
                            }
                        },
                        {
                            supplier_pallet_lend_source_warehouse_idTosupplier: {
                                warehouse_name: {
                                    contains: req.body.search
                                }
                            }
                        },

                        // 搜尋棧板
                        {
                            pallet_lend_detail: {
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
            const palletLend = await prisma.pallet_lend.findMany({
                skip: 10 * (req.body.page - 1),
                take: 10,
                where: searchObj,
                select: {
                    lend_id: true,
                    source_warehouse_id: true,
                    destination_warehouse_id: true,
                    lend_date: true,
                    order_number: true,
                    remark: true,
                    supplier_pallet_lend_destination_warehouse_idTosupplier: {
                        select: {
                            warehouse_name: true
                        }
                    },
                    supplier_pallet_lend_source_warehouse_idTosupplier: {
                        select: {
                            warehouse_name: true
                        }
                    },
                    pallet_lend_detail: {
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
                    lend_id: 'desc'
                }
            });

            palletLend.forEach(element => {
                element.lend_date = element.lend_date.toISOString().substring(0, 10);
                element.source_warehouse_name = element.supplier_pallet_lend_source_warehouse_idTosupplier.warehouse_name;
                element.destination_warehouse_name = element.supplier_pallet_lend_destination_warehouse_idTosupplier.warehouse_name;
                delete element.supplier_pallet_lend_source_warehouse_idTosupplier;
                delete element.supplier_pallet_lend_destination_warehouse_idTosupplier;

                element.pallet = {};
                element.pallet_lend_detail.forEach(detail => {
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

                delete element.pallet_lend_detail;

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

            success(res, 200, palletLend);
        } catch (error) {
            console.log(error);
            fail(res, 417, error);
        }
    },
    deleteLendDocument: async (req, res) => {
        try {
            // 取得原借出單的 1.來源庫別 2.目的庫別 3.借出棧板
            const palletLendDocument = await prisma.pallet_lend.findFirst({
                where: {
                    lend_id: req.body.lend_id
                },
                select: {
                    source_warehouse_id: true,
                    destination_warehouse_id: true,
                    pallet_lend_detail: {
                        select: {
                            type: true,
                            pallet_id: true
                        }
                    }
                }
            });

            // 判斷所有棧板均為 目的庫別 的在庫棧板
            const palletInventory = documentService.checkAllPalletInventory(palletLendDocument.destination_warehouse_id, palletLendDocument.pallet_lend_detail);
            palletInventory.then(async (inventory) => {
                if (inventory) {
                    const palletLendUpdate = prisma.pallet_lend.update({
                        where: {
                            lend_id: req.body.lend_id
                        },
                        data: {
                            flag: 'D',
                            modifier_user: req.body.modifier_user,
                            modified_date: new Date(),
                            modified_time: new Date(),
                            pallet_lend_detail: {
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

                    const palletLend = await prisma.pallet_lend.findFirst({
                        where: {
                            lend_id: req.body.lend_id
                        },
                        select: {
                            pallet_lend_detail: {
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
                            OR: palletLend.pallet_lend_detail
                        },
                        data: {
                            warehouse_id: palletLendDocument.source_warehouse_id,
                            modifier_user: req.body.modifier_user,
                            modified_date: new Date(),
                            modified_time: new Date(),
                        }
                    });

                    await prisma.$transaction([palletLendUpdate, updateSupplierPalletDetail]);

                    success(res, 200, null);
                } else {
                    // 部分棧板不在庫
                    fail(res, 400, '400.2');
                }
            });
        } catch (error) {
            console.log(error);
            fail(res, 417, error);
        }
    }
}

module.exports = lendController;
