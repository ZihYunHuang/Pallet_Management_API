const prisma = require('../services/prismaClientService');
const { success, fail } = require('../services/reponseService');

module.exports = async (req, res, next) => {
    try {
        const authority = await prisma.authority.count({
            where: {
                account_number: req.body.account_number,
                program_id: req.body.program_id,
                flag: ''
            }
        });

        if (authority == 0 || req.body.account_number == undefined || req.body.program_id == undefined) {
            fail(res, 401, 'permission denied');
        } else {
            next();
        }
    } catch (error) {
        console.log(error);
        fail(res, 417, error);
    }
}
