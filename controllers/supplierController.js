const prisma = require('../services/prismaClientService');
const e = require('cors');
const supplierService = require('../services/supplierService');
const { success, fail } = require('../services/reponseService');


const supplierController = {
    getSupplier: async (req, res) => {
        // where 搜尋條件(包含搜尋)
        const searchObj = {
            AND: [
                {
                    OR: [
                        { flag: '' },
                        { flag: 'M' },
                    ]
                },
                {
                    OR: [
                        {
                            warehouse_name: {
                                contains: req.body.search
                            }
                        },
                        {
                            warehouse_id: {
                                contains: req.body.search
                            }
                        },
                        {
                            supplier_type: {
                                sup_type_name: {
                                    contains: req.body.search
                                }
                            }
                        }
                    ]
                }
            ]
        };

        try {
            let supplier = await prisma.supplier.findMany({
                where: searchObj,
                select: {
                    warehouse_id: true,
                    warehouse_name: true,
                    supplier_type: {
                        select: {
                            sup_type_name: true
                        }
                    },
                    telephone: true,
                    pallet_base: true,
                    remark: true
                }
            });

            // 計算各材質棧板數量
            // *groupBy 無法做關聯
            const supplier_pallet_detail = await prisma.supplier_pallet_detail.groupBy({
                by: ['type', 'warehouse_id'],
                where: {
                    flag: ''
                },
                _count: {
                    pallet_id: true,
                }
            });

            const pallet_type = await prisma.pallet_type.findMany({
                where: {
                    flag: ''
                },
                select: {
                    pallet_type_id: true,
                    pallet_type_name: true
                }
            });

            supplier.forEach(supplier => {
                supplier.sup_type_name = supplier.supplier_type.sup_type_name;
                delete supplier.supplier_type;

                supplier.pallet = {};

                // 將棧板名稱加到 supplier.pallet[p_type] 物件中以及數量初始化
                pallet_type.forEach(p_type => {
                    supplier.pallet[p_type.pallet_type_id] = {
                        'pallet_type_name': p_type.pallet_type_name,
                        'total': 0
                    }
                });

                // 將 supplier_pallet_detail 計算之數量加到 supplier[pallet][p_type]
                supplier_pallet_detail.forEach(detail => {
                    if (detail.warehouse_id == supplier.warehouse_id) {
                        supplier.pallet[detail.type].total = detail._count['pallet_id'];
                    }
                });
            });

            // 排序：依所有類型棧板數量總和
            supplier.sort(function (a, b) {
                let a_num = 0;
                let b_num = 0;
                pallet_type.forEach(p_type => {
                    a_num = a_num + a.pallet[p_type.pallet_type_id].total;
                    b_num = b_num + b.pallet[p_type.pallet_type_id].total;
                });

                return a_num < b_num ? 1 : -1;
            });


            // 分頁
            let supplier_tmp = [];
            for (let i = (req.body.page * 10) - 10; i < req.body.page * 10; i++) {
                if (supplier[i] !== undefined) {
                    // 將物件忽略key值轉為陣列(將先前新增的物件配合前端所需json格式轉為陣列)
                    supplier[i].pallet = Object.values(supplier[i].pallet);
                    supplier_tmp.push(supplier[i]);
                }
            }

            success(res, 200, supplier_tmp);
        } catch (error) {
            console.log(error);
            fail(res, 417, error);
        }
    },
    getSupplierIdName: async (req, res) => {
        // where 條件(包含搜尋)
        const searchObj = {
            AND: [
                {
                    OR: [
                        { flag: '' },
                        { flag: 'M' },
                    ]
                },
                {
                    OR: [
                        {
                            warehouse_name: {
                                contains: req.body.search
                            }
                        },
                        {
                            warehouse_id: {
                                contains: req.body.search
                            }
                        }
                    ]
                }
            ]
        };

        try {
            const supplier = await prisma.supplier.findMany({
                where: searchObj,
                select: {
                    warehouse_id: true,
                    warehouse_name: true
                }
            });

            success(res, 200, supplier);
        } catch (error) {
            console.log(error);
            fail(res, 417, error);
        }
    },
    newSupplier: async (req, res) => {
        try {
            // 判斷該廠商有無建立歷史
            const supplierFounded = supplierService.getSupplierFounded(req.body.create_data.warehouse_id);
            supplierFounded.then(async function (foundedReturnData) {
                if (foundedReturnData.supplier_founded == false) {　// 無建立歷史
                    await prisma.supplier.create({
                        data: req.body.create_data
                    });

                    success(res, 201, null);
                } else {　// 有建立歷史
                    if (foundedReturnData.flag == 'D') {
                        await prisma.supplier.update({
                            where: {
                                warehouse_id: req.body.create_data.warehouse_id
                            },
                            data: {
                                flag: '',
                                warehouse_name: req.body.create_data.warehouse_name,
                                telephone: req.body.create_data.telephone,
                                pallet_base: req.body.create_data.pallet_base,
                                sup_type_id: req.body.create_data.sup_type_id,
                                creator_user: req.body.create_data.creator_user,
                                creation_date: new Date(),
                                creation_time: new Date(),
                                modifier_user: '',
                                modified_date: null,
                                modified_time: null
                            }
                        });

                        success(res, 200, null);
                    } else {
                        // ID 已存在
                        fail(res, 400, '400.1');
                    }
                }
            })
        } catch (error) {
            console.log(error)
            fail(res, 417, error);
        }
    },
    editSupplier: async (req, res) => {
        req.body.modified_date = new Date();
        req.body.modified_time = new Date();
        try {
            await prisma.supplier.update({
                where: {
                    warehouse_id: req.body.warehouse_id
                },
                data: req.body.update_data
            });

            success(res, 200, null);
        } catch (error) {
            console.log(error)
            fail(res, 417, error);
        }
    },
    deleteSupplier: async (req, res) => {
        try {

            const supplierPalletDetailCount = await prisma.supplier_pallet_detail.count({
                where: {
                    warehouse_id: req.body.warehouse_id,
                    flag: ''
                }
            });

            // 刪除前檢查該廠商是否有棧板尚未歸還
            if (supplierPalletDetailCount != 0) {
                fail(res, 400, '400.2');
            } else {
                await prisma.supplier.update({
                    where: {
                        warehouse_id: req.body.warehouse_id
                    },
                    data: {
                        flag: 'D',
                        modifier_user: req.body.modifier_user,
                        modified_date: new Date(),
                        modified_time: new Date()
                    }
                });

                success(res, 200, null);
            }
        } catch (error) {
            console.log(error)
            fail(res, 417, error);
        }
    },
    getInventory: async (req, res) => {
        try {
            const pallet = await prisma.supplier.findMany({
                where: {
                    warehouse_id: req.body.warehouse_id,
                    OR: [
                        { flag: '' },
                        { flag: 'M' },
                    ]
                },
                select: {
                    supplier_pallet_detail: {
                        where: {
                            type: req.body.pallet_type_id,
                            flag: ''
                        },
                        select: {
                            pallet_id: true
                        },
                        orderBy: {
                            pallet_id: 'asc'
                        }
                    }
                }
            });

            let palletArr = [];
            pallet[0].supplier_pallet_detail.forEach(element => {
                palletArr.push(element.pallet_id);
            });

            success(res, 200, palletArr);
        } catch (error) {
            console.log(error);
            fail(res, 417, error);
        }
    },
    getInventoryStatus: async (req, res) => {
        let pallet_founded = true;
        let inventory = true;

        try {
            const pallet = await prisma.pallet.findMany({
                where: {
                    type: req.body.pallet_type_id,
                    pallet_id: req.body.pallet_id,
                    flag: '',
                    discard_status: false
                }
            });

            if (pallet[0] == undefined) {
                pallet_founded = false;
            }

            const supplierPalletDetail = await prisma.supplier_pallet_detail.findMany({
                where: {
                    warehouse_id: req.body.warehouse_id,
                    type: req.body.pallet_type_id,
                    pallet_id: req.body.pallet_id,
                    flag: ''
                }
            });

            if (supplierPalletDetail[0] == undefined) {
                inventory = false;
            }

            success(res, 200, {
                'pallet_founded': pallet_founded,
                'inventory': inventory
            });
        } catch (error) {
            console.log(error);
            fail(res, 417, error);
        }
    },
    getSupplierType: async (req, res) => {
        try {
            const supplierType = await prisma.supplier_type.findMany({
                where: {
                    flag: ''
                },
                select: {
                    sup_type_id: true,
                    sup_type_name: true,
                    remark: true
                },
                orderBy: {
                    sup_type_id: 'asc'
                }
            });

            success(res, 200, supplierType);
        } catch (error) {
            console.log(error);
            fail(res, 417, error);
        }
    },
    newSupplierType: async (req, res) => {
        try {
            const supplierTypeExist = await prisma.supplier_type.findUnique({
                where: {
                    'sup_type_id': req.body.sup_type_id
                },
                select: {
                    flag: true
                }
            })

            // 無建立過該類型
            if (supplierTypeExist == null) {
                await prisma.supplier_type.create({
                    data: {
                        'sup_type_id': req.body.sup_type_id,
                        'sup_type_name': req.body.sup_type_name,
                        'remark': req.body.remark,
                        'creator_user': req.body.creator_user
                    }
                });

                success(res, 201);
            } else {
                // 有建立過該類型
                if (supplierTypeExist.flag == 'D') {
                    await prisma.supplier_type.update({
                        where: {
                            'sup_type_id': req.body.sup_type_id,
                        },
                        data: {
                            'flag': '',
                            'sup_type_name': req.body.sup_type_name,
                            'remark': req.body.remark,
                            'creator_user': req.body.creator_user,
                            'creation_date': new Date(),
                            'creation_time': new Date(),
                            'modifier_user': '',
                            'modified_date': null,
                            'modified_time': null
                        }
                    });

                    success(res, 200);
                } else {
                    // ID 已存在
                    fail(res, 400, '400.1');
                }
            }


        } catch (error) {
            fail(res, 417, error);
        }
    },
    editSupplierType: async (req, res) => {
        try {
            await prisma.supplier_type.update({
                where: {
                    sup_type_id: req.body.sup_type_id
                },
                data: {
                    "sup_type_name": req.body.sup_type_name,
                    "remark": req.body.remark,
                    "modified_date": new Date(),
                    "modified_time": new Date(),
                    "modifier_user": req.body.modifier_user
                }
            });
            success(res, 200);
        } catch (error) {
            console.log(error);
            fail(res, 417, error);
        }
    },
    deleteSupplierType: async (req, res) => {
        try {
            // 取得尚在使用該類型之廠商
            const type_used = await prisma.supplier.count({
                where: {
                    flag: {
                        not: 'D'
                    },
                    sup_type_id: req.body.sup_type_id
                }
            });

            if (type_used == 0) {
                await prisma.supplier_type.update({
                    where: {
                        sup_type_id: req.body.sup_type_id
                    },
                    data: {
                        "flag": 'D'
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

module.exports = supplierController;