const prisma = require('../db')

const createAttachment = async (data) => {
    try {
        const newAttachment = await prisma.attachment.create({
            data
        })
        return newAttachment
    } catch (error) {
        console.log(error)
    }
}

const editAttachment = async (documentId, attachmentId) => {

    const attachment = await getAttachment(documentId)

    try {
        const toEdit = await prisma.attachment.update({
            where: {
                id: attachment.id
            },
            data: {
                attachmentId
            }
        })

        return toEdit

    } catch (error) {
        console.log(error)
    }
}

const deleteAttachment = async (documentId) => {

    if (documentId) {
        const attachment = await getAttachment(documentId)

        try {
            const response = await prisma.attachment.delete({
                where: {
                    id: attachment.id
                }
            })
            return response
        } catch (error) {
            console.log(error)
        }
    } else {
        return null
    }
}

const getAttachment = async (documentId) => {
    try {
        const response = await prisma.attachment.findFirst({
            where: {
                documentId
            }
        })
        return response
    } catch (error) {
        console.log(error)
    }
}

module.exports = {
    createAttachment,
    editAttachment,
    deleteAttachment,
    getAttachment
}