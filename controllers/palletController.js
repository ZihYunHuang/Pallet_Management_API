const prisma = require('../services/prismaClientService');
const supplierService = require('../services/supplierService');
const palletService = require('../services/palletService');
const { success, fail } = require('../services/reponseService');


const palletController = {
    getPallet: async (req, res) => {
        // where 條件(包含搜尋)
        const searchObj = {
            AND: [
                {
                    flag: '',
                    discard_status: false,
                },
                {
                    OR: [
                        {
                            pallet_id: {
                                contains: req.body.search
                            }
                        },
                        {
                            type: {
                                contains: req.body.search
                            }
                        },
                        {
                            pallet_type: {
                                pallet_type_name: {
                                    contains: req.body.search
                                }

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
                        },
                        {
                            supplier_pallet_detail: {
                                supplier: {
                                    warehouse_name: {
                                        contains: req.body.search
                                    }
                                }
                            }
                        }
                    ]
                }
            ]
        };

        try {
            const pallet = await prisma.pallet.findMany({
                skip: 10 * (req.body.page - 1),
                take: 10,
                where: searchObj,
                select: {
                    pallet_id: true,
                    pallet_type: {
                        select: {
                            pallet_type_id: true,
                            pallet_type_name: true
                        }
                    },
                    supplier_pallet_detail: {
                        select: {
                            supplier: {
                                select: {
                                    warehouse_name: true
                                }
                            }
                        }
                    },
                    creation_date: true,
                    creator_user: true
                },
                orderBy: [
                    {
                        pallet_id: 'asc',
                    },
                    {
                        type: 'asc',
                    }
                ]
            });

            pallet.forEach(element => {
                element.pallet_type_id = element.pallet_type.pallet_type_id;
                element.pallet_type_name = element.pallet_type.pallet_type_name;
                delete element.pallet_type;

                element.warehouse_name = element.supplier_pallet_detail.supplier.warehouse_name;
                delete element.supplier_pallet_detail;

                element.creation_date = element.creation_date.toISOString().substring(0, 10)
            });

            success(res, 200, pallet);
        } catch (error) {
            console.log(error);
            fail(res, 417, error);
        }
    },
    newPallet: async (req, res) => {
        try {
            const mainSupplier = await prisma.supplier.findFirst({
                where: {
                    flag: 'M'
                }
            });

            // 判斷該棧板有無建立歷史
            const palletFounded = palletService.getPalletFounded({
                pallet_id: req.body.pallet_id,
                type: req.body.pallet_type_id
            });
            palletFounded.then(async function (foundedReturnData) {
                if (foundedReturnData.pallet_founded == false) { // 無建立歷史
                    try {
                        await prisma.pallet.create({
                            data: {
                                pallet_id: req.body.pallet_id,
                                type: req.body.pallet_type_id,
                                creator_user: req.body.creator_user,
                                supplier_pallet_detail: {
                                    create: {
                                        warehouse_id: mainSupplier.warehouse_id,
                                        creator_user: req.body.creator_user,
                                    }
                                }
                            }
                        });

                        success(res, 201, null);
                    } catch (error) {
                        fail(res, 417, error)
                    }
                } else { // 有建立歷史
                    if (foundedReturnData.flag == 'D' || foundedReturnData.discard_status == true) {
                        await prisma.pallet.update({
                            where: {
                                pallet_id_type: {
                                    pallet_id: req.body.pallet_id,
                                    type: req.body.pallet_type_id
                                }
                            },
                            data: {
                                flag: '',
                                discard_status: false,
                                creator_user: req.body.creator_user,
                                creation_date: new Date(),
                                creation_time: new Date(),
                                supplier_pallet_detail: {
                                    update: {
                                        flag: '',
                                        warehouse_id: mainSupplier.warehouse_id,
                                        creator_user: req.body.creator_user,
                                        creation_date: new Date(),
                                        creation_time: new Date()
                                    }
                                }
                            }
                        });

                        success(res, 200, null);
                    } else {
                        // ID 已存在
                        fail(res, 400, '400.1');
                    }
                }
            });
        } catch (error) {
            console.log(error);
            fail(res, 417, error);
        }
    },
    deletePallet: async (req, res) => {
        // 刪除前檢查棧板是否有被借出(棧板刪除時應該在龍泉廠)
        const mainSupplier = await prisma.supplier.findFirst({
            where: {
                flag: 'M'
            }
        });

        // 判斷棧板是否在庫
        const palletInventory = supplierService.getPalletInventory({
            warehouse_id: mainSupplier.warehouse_id,
            pallet_id: req.body.pallet_id,
            type: req.body.pallet_type_id
        });

        palletInventory.then(async function (inventoryReturnData) {
            if (inventoryReturnData == false) {
                // 該棧板不在庫
                fail(res, 400, '400.2');
            } else {
                // 執行刪除
                try {
                    await prisma.pallet.update({
                        where: {
                            pallet_id_type: {
                                type: req.body.pallet_type_id,
                                pallet_id: req.body.pallet_id,
                            }
                        },
                        data: {
                            flag: 'D',
                            modifier_user: req.body.modifier_user,
                            modified_date: new Date(),
                            modified_time: new Date(),
                            supplier_pallet_detail: {
                                update: {
                                    flag: 'D'
                                }
                            }
                        }
                    });

                    success(res, 200, null);
                } catch (error) {
                    console.log(error);
                    fail(res, 417, error);
                }
            }
        })
    },
    getPalletType: async (req, res) => {
        try {
            const palletType = await prisma.pallet_type.findMany({
                where: {
                    flag: ''
                },
                select: {
                    pallet_type_id: true,
                    pallet_type_name: true,
                    remark: true
                },
                orderBy: {
                    creation_date: 'asc',
                }
            });

            success(res, 200, palletType);
        } catch (error) {
            console.log(error);
            fail(res, 417, error);
        }
    },
    newPalletType: async (req, res) => {
        try {
            const palletTypeExist = await prisma.pallet_type.findUnique({
                where: {
                    pallet_type_id: req.body.pallet_type_id
                },
                select: {
                    flag: true
                }
            });

            // 無建立過該類型
            if (palletTypeExist == null) {
                await prisma.pallet_type.create({
                    data: {
                        pallet_type_id: req.body.pallet_type_id,
                        pallet_type_name: req.body.pallet_type_name,
                        remark: req.body.remark,
                        creator_user: req.body.creator_user
                    }
                });

                success(res, 201);
            } else {
                if (palletTypeExist.flag == 'D') {
                    await prisma.pallet_type.update({
                        where: {
                            pallet_type_id: req.body.pallet_type_id,
                        },
                        data: {
                            flag: '',
                            pallet_type_name: req.body.pallet_type_name,
                            remark: req.body.remark,
                            creator_user: req.body.creator_user,
                            creation_date: new Date(),
                            creation_time: new Date(),
                            modifier_user: '',
                            modified_date: null,
                            modified_time: null
                        }
                    });

                    success(res, 200);
                } else {
                    // ID 已存在
                    fail(res, 400, '400.1');
                }
            }

        } catch (error) {
            fail(res, 417);
        }
    },
    editPalletType: async (req, res) => {
        try {
            await prisma.pallet_type.update({
                where: {
                    pallet_type_id: req.body.pallet_type_id
                },
                data: {
                    pallet_type_name: req.body.pallet_type_name,
                    remark: req.body.remark,
                    modified_date: new Date(),
                    modified_time: new Date(),
                    modifier_user: req.body.modifier_user,
                }
            });

            success(res, 200);
        } catch (error) {
            console.log(error);
            fail(res, 417, error);
        }
    },
    deletePalletType: async (req, res) => {
        try {
            const type_used = await prisma.pallet.count({
                where: {
                    flag: '',
                    discard_status: false,
                    type: req.body.pallet_type_id
                }
            });

            // 判斷是否有尚在使用該類型之棧板
            if (type_used == 0) {
                await prisma.pallet_type.update({
                    where: {
                        pallet_type_id: req.body.pallet_type_id
                    },
                    data: {
                        flag: 'D'
                    }
                });

                success(res, 200);
            } else {
                // 該類型尚被使用
                fail(res, 400, '400.2');
            }
        } catch (error) {
            console.log(error);
            fail(res, 417, error);
        }
    },
}

module.exports = palletController;
