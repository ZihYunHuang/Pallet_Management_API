const prisma = require('../services/prismaClientService');
const crypto = require('crypto-js');
const jwt = require('jsonwebtoken');
const { success, fail } = require('../services/reponseService');


module.exports = {
    getUser: async (req, res) => {
        try {
            const user = await prisma.profile.findUnique({
                where: {
                    account_number: req.body.account_number
                }
            });

            success(res, 200, {
                'user_name': user.user_name,
                'email': user.email
            });
        } catch (error) {
            console.log(error);
            fail(res, 417, error);
        }
    },
    newUser: async (req, res) => {
        // # 20200805
        // # todo: 前端call API會有warning，可能是加密套件(crypto.js)的問題
        let hash = crypto.algo.SHA256.create();
        hash.update(req.body.password);
        passwordHash = hash.finalize().toString(crypto.enc.Hex);
        try {
            await prisma.profile.create({
                data: {
                    account_number: req.body.user_id,
                    user_name: req.body.user_name,
                    email: req.body.email,
                    creator_user: req.body.creator_user,
                    account: {
                        create: {
                            password: passwordHash,
                            creator_user: req.body.creator_user
                        }
                    }
                }
            });

            success(res, 201, null);
        } catch (error) {
            fail(res, 417, "This user already exists.");
        }
    },
    editUser: async (req, res) => {
        if (req.body.profile !== undefined) {
            req.body.profile.modified_date = new Date();
            req.body.profile.modified_time = new Date();
            try {
                // 更改基本資料
                await prisma.profile.update({
                    where: {
                        account_number: req.body.account_number
                    },
                    data: req.body.profile
                });
            } catch (error) {
                console.log(error);
                fail(res, 417, error);
            }
        }

        // 更改密碼
        if (req.body.account !== undefined) {
            let hash = crypto.algo.SHA256.create();
            hash.update(req.body.account.password);
            passwordHash = hash.finalize().toString(crypto.enc.Hex);
            try {
                await prisma.account.update({
                    where: {
                        account_number: req.body.account_number
                    },
                    data: {
                        password: passwordHash,
                        modifier_user: req.body.account.modifier_user,
                        modified_date: new Date(),
                        modified_time: new Date(),
                    }
                });
            } catch (error) {
                console.log(error);
                fail(res, 417, error);
            }
        }

        success(res, 200, null);
    },
    deleteUser: async (req, res) => {
        try {
            await prisma.profile.update({
                where: {
                    account_number: req.body.user_id,
                },
                data: {
                    flag: 'D',
                    modifier_user: req.body.modifier_user,
                    modified_date: new Date(),
                    modified_time: new Date(),
                    account: {
                        update: {
                            flag: 'D',
                            modifier_user: req.body.modifier_user,
                            modified_date: new Date(),
                            modified_time: new Date(),
                        }
                    }
                }
            });

            success(res, 200, null);
        } catch (error) {
            console.log(error);
            fail(res, 417, error);
        }
    },
    login: async (req, res) => {
        let hash = crypto.algo.SHA256.create();
        hash.update(req.body.password);
        passwordHash = hash.finalize().toString(crypto.enc.Hex);

        try {
            const user = await prisma.account.findFirst({
                where: {
                    account_number: req.body.account_number,
                    active: true,
                    flag: ''
                }
            });

            if (user.password !== passwordHash) {
                fail(res, 401, 'Password is incorrect');
            }

            // 建立 Token
            const token = jwt.sign({ account_number: user.account_number }, process.env.PASSPORT_SECRET, { expiresIn: '8h' });

            success(res, 200, token);
        } catch (error) {
            // flag 為 'D' 或 active 為 false
            console.log(error);
            fail(res, 403, 'User not found');
        }
    },
    editUserActive: async (req, res) => {
        try {
            await prisma.account.update({
                where: {
                    account_number: req.body.user_id
                },
                data: {
                    active: req.body.active,
                    modifier_user: req.body.modifier_user,
                    modified_date: new Date(),
                    modified_time: new Date(),
                }
            });

            success(res, 200, null);
        } catch (error) {
            fail(res, 417, 'This ID does not exist.');
        }
    },
    getUserPermission: async (req, res) => {
        try {
            const userPermission = await prisma.authority.findMany({
                where: {
                    account_number: req.body.account_number,
                    flag: '',
                    account_number: {
                        contains: req.body.account_number,
                    },
                },
                select: {
                    programs: {
                        select: {
                            program_id: true,
                            program_name: true,
                            app_url: true,
                            app_icon: true,
                            item_num: true
                        },
                        // # 20200804
                        // # todo: 依照 prisma 文件可在關聯使用where，但實作無法使用。
                        // where: {
                        //     NOT: [
                        //         { flag: 'D' }
                        //     ]
                        // }
                    }
                }
            });

            userPermission.sort(function (a, b) {
                return a.programs.item_num - b.programs.item_num;
            });

            let userPermissionTmp = [];
            userPermission.forEach(element => {
                userPermissionTmp.push(element.programs);
            });

            success(res, 200, userPermissionTmp);
        } catch (error) {
            console.log(error);
            fail(res, 417, 'This ID does not exist.');
        }
    },
    deleteUserPermission: async (req, res) => {
        try {
            await prisma.authority.updateMany({
                where: {
                    account_number: req.body.user_id,
                    program_id: req.body.user_program_id
                },
                data: {
                    flag: 'D',
                    modifier_user: req.body.modifier_user,
                    modified_date: new Date(),
                    modified_time: new Date()
                }
            });

            success(res, 200, null);
        } catch (error) {
            console.log(error);
            fail(res, 417, 'This ID does not exist.');
        }
    },
    newUserPermission: async (req, res) => {
        try {
            await prisma.authority.upsert({
                where: {
                    account_number_program_id: {
                        account_number: req.body.user_id,
                        program_id: req.body.user_program_id,
                    }
                },
                create: {
                    account_number: req.body.user_id,
                    program_id: req.body.user_program_id,
                    creator_user: req.body.creator_user,
                },
                update: {
                    flag: ''
                }
            });

            success(res, 201, null);
        } catch (error) {
            console.log(error);
            fail(res, 417, error);
        }
    },
    getAllUser: async (req, res) => {
        try {
            const users = await prisma.profile.findMany({
                where: {
                    flag: ''
                },
                select: {
                    account_number: true,
                    user_name: true,
                    email: true,
                    account: {
                        select: {
                            active: true
                        }
                    },
                    authority: {
                        select: {
                            program_id: true,
                            programs: {
                                select: {
                                    program_name: true
                                }
                            }
                        },
                        where: {
                            flag: ''
                        }
                    }
                }
            });

            users.forEach(element => {
                element.active = element.account.active;
                delete element.account;

                let authority_tmp = [];
                if (element.authority.length !== 0) {
                    element.authority.forEach(auth => {
                        authority_tmp.push({
                            'program_id': auth.program_id,
                            'program_name': auth.programs.program_name
                        });
                    });
                }

                element.authority = authority_tmp;
            });

            success(res, 200, users);
        } catch (error) {
            console.log(error);
            fail(res, 417, error);
        }
    }
}
