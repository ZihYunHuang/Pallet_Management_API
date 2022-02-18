const prisma = require('../services/prismaClientService');
const { success, fail } = require('../services/reponseService');


// 判斷棧板是否被建立(包含刪除及報廢)
async function getPalletFounded(data) {
    // data 須包含 pallet_id, type
    try {
        const pallet = await prisma.pallet.findFirst({
            where: {
                type: data.type,
                pallet_id: data.pallet_id
            },
            select: {
                flag: true,
                discard_status: true
            }
        });

        if (pallet == null) {
            return {
                'pallet_founded': false
            }
        } else {
            return {
                'pallet_founded': true,
                'flag': pallet.flag,
                'discard_status': pallet.discard_status
            }
        }
    }
    catch (error) {
        console.log(error);
        fail(res, 417, error);
    }
}

module.exports = {
    getPalletFounded
}