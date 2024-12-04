const express = require("express")
const router = express.Router()
const { 
    getOptions,
    createDocument, 
    editDocument,
    deleteDocument,
    getTotalDocuments, 
    getTotalPages, 
    getDocument, 
    getDocumentById,
    groupByType,  
    groupByYear } = require('./document.service')
const {
    deleteAttachment
} = require('../attachment/attachment.service')

router.get('/options', async (req, res) => {
    try {
        const options = await getOptions()
        res.status(200).send(options)
    } catch (error) {
        res.status(400).send(error.message)
    }
})

router.post('/', async (req, res) => {
    try {
        const { title, about, type, tag, year, number, createdAt, status, file } = req.body
        const newDocument = await createDocument({ title, about, type, tag, year, number, createdAt, status, file })
        res.status(200).json({data: newDocument, message: "Data Created Successfully"})
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.patch('/:id', async (req, res) => {

    const id = req.params.id
    const data = req.body

    const document = await getDocumentById(id)

    if (document.attachment.length) {
        await deleteAttachment(id)
    }

    try {
        const edited = await editDocument(data, id)
        res.status(200).send({data: edited, message: "Data Updated Successfully"})
    } catch (error) {
        res.status(400).send(error.message)
    }
})

router.delete('/:id', async (req, res) => {
    const id = req.params.id
    try {
        await deleteDocument(id)
        res.status(200).send({message: "Data Deleted"})
    } catch (error) {
        res.status(400).send(error.message)
    }
})

router.get('/', async (req, res) => {

    const search = req.query.search
    const type = req.query.type
    const tag = req.query.tag
    const year = req.query.year
    const number = req.query.number
    const sortBy = req.query.sortBy

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.size) || 12;

    try {
        const documents = await getDocument(search, type, tag, year, number, page, pageSize, sortBy)
        const totalPages = await getTotalPages(search, type, tag, year, number, pageSize)
        const totalDocuments = await getTotalDocuments(search, type, tag, year, number)

        res.status(200).send({
            documents,
            totalPages,
            totalDocuments
        })
    } catch (error) {
        res.status(500).send({ error: error.message })
    }
})

router.get('/count/type', async (req, res) => {
    try {
        const numberOfDocuments = await groupByType()
        res.status(200).send(numberOfDocuments)
        
    } catch (error) {
        res.status(404).send({ error: error.message })
    }
})

router.get('/count/year', async (req, res) => {

    const type = req.query.type

    try {
        const numberOfDocuments = await groupByYear(type)
        res.status(200).send(numberOfDocuments)
        
    } catch (error) {
        res.status(404).send({ error: error.message })
    }
})

router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id
        const document = await getDocumentById(id)
        res.status(200).send(document)
    } catch (error) {
        res.status(500).send({ error: error.message })
    }
})

module.exports = router