const prisma = require('../services/prismaClientService');
const { success, fail } = require('../services/reponseService');

// 判斷棧板是否在庫
async function getPalletInventory(data) {
    // data 須包含 pallet_id, type, warehouse_id
    try {
        const supplierPalletDetail = await prisma.supplier_pallet_detail.findFirst({
            where: {
                warehouse_id: data.warehouse_id,
                type: data.type,
                pallet_id: data.pallet_id,
                flag: ''
            }
        });

        if (supplierPalletDetail == null) {
            return false;
        } else {
            return true;
        }
    }
    catch (error) {
        console.log(error);
        fail(res, 417, error);
    }
}

// 判斷廠商是否被建立(包含刪除)
async function getSupplierFounded(warehouseId) {
    try {
        const supplier = await prisma.supplier.findFirst({
            where: {
                warehouse_id: warehouseId
            },
            select: {
                flag: true
            }
        });

        if (supplier == null) {
            return {
                'supplier_founded': false
            }
        } else {
            return {
                'supplier_founded': true,
                'flag': supplier.flag
            }
        }
    }
    catch (error) {
        console.log(error);
        fail(res, 417, error);
    }
}

module.exports = {
    getPalletInventory,
    getSupplierFounded
}