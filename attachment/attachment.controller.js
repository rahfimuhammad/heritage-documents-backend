const express = require("express")
const router = express.Router()
const { 
    createAttachment,
    editAttachment,
    deleteAttachment,
    getAttachment
} = require('./attachment.service')

router.get('/:documentId', async (req, res) => {

    const documentId = req.params.id

    try {
        const attachment = await getAttachment(documentId)
        res.status(200).send(attachment)
    } catch (error) {
        res.status(500).send({ error: error.message })
    }
})

router.post('/', async (req, res) => {
    try {
        const { documentId, attachmentId } = req.body
        const newDocument = await createAttachment({ documentId, attachmentId })
        res.status(200).json(newDocument)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.patch('/:id', async (req, res) => {

    const id = req.params
    const data = req.body

    try {
        const edited = await editAttachment(data, id)
        res.status(200).send({edited})
    } catch (error) {
        res.status(400).send(error.message)
    }
})

router.delete('/:id', async (req, res) => {
    const id = req.params

    try {
        const deleted = await deleteAttachment(id)
        res.status(200).send(deleted)
    } catch (error) {
        res.status(500).send(error.message)
    }
})

module.exports = router