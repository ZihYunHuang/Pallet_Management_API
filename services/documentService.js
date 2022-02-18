const prisma = require('../services/prismaClientService');
const { success, fail } = require('../services/reponseService');

// 取得流水碼
async function getSequenceNumber(date, program_id) {
    try {
        // 確認 program_id 與 constvalue 是否存在，若不存在新增
        const upsertProgEncoding = await prisma.prog_encoding.upsert({
            where: {
                program_id_constvalue: {
                    program_id: program_id,
                    constvalue: date
                }
            },
            create: {
                program_id: program_id,
                constvalue: date,
                now_num: 0,
                num_length: 3
            },
            update: {
                num_length: 3
            }
        });
        let sequenceNumber = upsertProgEncoding.constvalue + (upsertProgEncoding.now_num + 1).toString().padStart(3, '0');

        return {
            'sequenceNumber': sequenceNumber,
            'nowNum': upsertProgEncoding.now_num
        };
    } catch (error) {
        console.log(error);
        fail(res, 417, error);
    }
}

// 判斷所有棧板是否在庫
async function checkAllPalletInventory(warehouseId, palletArr) {
    try {
        const supplierPalletDetail = await prisma.supplier_pallet_detail.findMany({
            where: {
                AND: [
                    {
                        flag: '',
                        warehouse_id: warehouseId
                    },
                    {
                        OR: palletArr
                    }
                ]

            }
        });

        if (supplierPalletDetail.length == palletArr.length) {
            // 所有棧板均在庫
            return true;
        } else {
            // 含有不在庫棧板
            return false;
        }

    } catch (error) {
        console.log(error);
        fail(res, 417, error);
    }
}

module.exports = {
    getSequenceNumber,
    checkAllPalletInventory
}