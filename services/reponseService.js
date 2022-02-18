module.exports = {
    fail: (res, code, data) => {
        res.status(code).send({
            'status': 'fail',
            'data': data
        })
    },
    success: (res, code, data) => {
        if (data !== null) {
            res.status(code).send({
                'status': 'success',
                'data': data
            })
        } else {
            res.status(code).send({
                'status': 'success'
            })
        }
    }
}