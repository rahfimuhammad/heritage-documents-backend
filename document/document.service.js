const prisma = require('../db')
const { editAttachment, createAttachment, deleteAttachment } = require('../attachment/attachment.service')

const getOptions = async () => {

    try {
        const options = await prisma.document.findMany()
        return options
    } catch (error) {
        console.log(error)
    }
}

const createDocument = async (data) => {
    try {
        const { title, about, type, year, number, createdAt, status, file } = data
        
        const ISODate = new Date(createdAt).toISOString()
        
        const newDocument = await prisma.document.create({
            data: {
                title,
                about,
                type,
                year,
                number,
                createdAt: ISODate,
                file,
                status
            }
        })
        return newDocument
    } catch (error) {
        console.log(error)
    }
}

const editDocument = async (data, id) => {

    const { title, about, type, year, number, createdAt, status, file, attachmentId } = data
    const ISODate = new Date(createdAt).toISOString()
    const existingDocument = await getDocumentById(id)

    try {
        await prisma.document.update({
            where: {
                id
            },
            data: {
                title,
                about,
                type,
                year,
                number,
                createdAt: ISODate,
                status,
                file
            }
        })

    } catch (error) {
        console.log(error)
    }

    if(attachmentId && existingDocument?.linked?.length > 0) {
        try {
            let attachmentToEdit = await editAttachment(id, attachmentId)
            return attachmentToEdit
        } catch (error) {
            console.log(error)
        }
    } else if(attachmentId && existingDocument?.linked?.length === 0) {
        try {
            let attachmentToEdit = await createAttachment({ documentId: id, attachmentId })
            return attachmentToEdit
        } catch (error) {
            console.log(error)
        }
    } else if(!attachmentId && existingDocument?.linked?.length > 0) {
        try {
            let attachmentToEdit = await deleteAttachment(id)
            return attachmentToEdit
        } catch (error) {
            console.log(error)
        }
    }
}

const deleteDocument = async (id) => {
    try {
        await prisma.$transaction([
            prisma.attachment.deleteMany({
                where: {
                    OR: [
                        { documentId: id },
                        { attachmentId: id }
                    ]
                }
            }),
            prisma.document.delete({
                where: { id }
            })
        ]);
        console.log("Document and related attachments deleted successfully.");
    } catch (error) {
        console.error("Failed to delete document:", error);
        throw error;
    }
}; 

const groupByType = async () => {
    const documentCounts = await prisma.document.groupBy({
        by: ['type'],
        _count: {
            type: true,
        }
    });

    // Tentukan urutan hierarki khusus
    const customOrder = [
        'Undang-undang',
        'Peraturan Menteri',
        'Peraturan Daerah',
        'Peraturan Gubernur',
        'Keputusan Gubernur',
        'Kajian TACB',
        'Rekomendasi TAP'
    ];

    // Sorting berdasarkan urutan di dalam `customOrder`
    documentCounts.sort((a, b) => {
        return customOrder.indexOf(a.type) - customOrder.indexOf(b.type);
    });

    return documentCounts;
};

const groupByYear = async (type) => {
    const documentCounts = await prisma.document.groupBy({
        where: {
            type
        },
        by: ['year'],
        _count: {
            year: true,
        }
    });

    // Tambahkan `type` ke setiap objek di dalam `documentCounts`
    const resultWithType = documentCounts.map(item => ({
        ...item,
        type: type
    }));

    return resultWithType;
};

const getTotalDocuments = async (search, type, tag, year, number) => {

    let whereCondition = {}; 

    // if (search) {
    //     // Memisahkan kata kunci menjadi array kata
    //     const searchKeywords = search.split(' ').map((word) => word.trim());

    //     // Membuat kondisi `AND` untuk setiap kata dalam setiap bidang
    //     whereCondition = {
    //         ...whereCondition,
    //         AND: searchKeywords.map((keyword) => ({
    //             OR: [
    //                 { title: { contains: keyword } },
    //                 { about: { contains: keyword } },
    //                 { type: { contains: keyword } },
    //                 { tag: { contains: keyword } },
    //                 { year: { contains: keyword } },
    //                 { number: { contains: keyword } }
    //             ]
    //         }))
    //     };
    // }
    if (search) {
        // Memisahkan kata kunci menjadi array kata
        const searchKeywords = search.split(' ').map((word) => word.trim());

        // Membuat kondisi `OR` untuk setiap kata dalam setiap bidang
        whereCondition = {
            ...whereCondition,
            OR: searchKeywords.map((keyword) => ({
                OR: [
                    { title: { contains: keyword } },
                    { about: { contains: keyword } },
                    { type: { contains: keyword } },
                    { tag: { contains: keyword } },
                    { year: { contains: keyword } },
                    { number: { contains: keyword } }
                ]
            }))
        };
    }
    if (type) {
        whereCondition = { ...whereCondition, type: type };
    }
    if (tag) {
        whereCondition = { ...whereCondition, tag: tag };
    }
    if (year) {
        whereCondition = { ...whereCondition, year: year };
    }
    if (number) {
        whereCondition = { ...whereCondition, number: number };
    }

    const totalDocuments = await prisma.document.count({
        where: whereCondition
    })
    return totalDocuments
}

const getTotalPages = async (search, type, tag, year, number, pageSize) => {

    const totalDocuments = await getTotalDocuments(search, type, tag, year, number);
    const totalPages = Math.ceil(totalDocuments / pageSize);
    return totalPages;
};

const getDocument = async (search, type, tag, year, number, page = 1, pageSize = 10, sortBy) => {
    const skip = (page - 1) * pageSize;
    let whereCondition = {};
    let orderBy = {};

    // if (search) {
    //     whereCondition = {
    //         ...whereCondition,
    //         OR: [
    //             { title: { contains: search } },
    //             { about: { contains: search } },
    //             { type: { contains: search } },
    //             { tag: { contains: search } },
    //             { year: { contains: search } },
    //             { number: { contains: search } }
    //         ]
    //     };
    // }

    if (search) {

        const searchKeywords = search.split(' ').map((word) => word.trim());

        whereCondition = {
            ...whereCondition,
            OR: searchKeywords.map((keyword) => ({
                OR: [
                    { title: { contains: keyword } },
                    { about: { contains: keyword } },
                    { type: { contains: keyword } },
                    { tag: { contains: keyword } },
                    { year: { contains: keyword } },
                    { number: { contains: keyword } }
                ]
            }))
        };
    }
    if (type) {
        whereCondition = { ...whereCondition, type: type };
    }
    if (tag) {
        whereCondition = { ...whereCondition, tag: tag };
    }
    if (year) {
        whereCondition = { ...whereCondition, year: year };
    }
    if (number) {
        whereCondition = { ...whereCondition, number: number };
    }

    switch (sortBy) {
        case 'default':
            orderBy = {
                id: 'desc'
            };
        case 'year-a-z':
            orderBy = {
                createdAt: 'asc'
            };
            break;
        case 'year-z-a':
            orderBy = {
                createdAt: 'desc'
            };
            break;
        case 'type-a-z':
            orderBy = {
                type: 'asc'
            };
            break;
        case 'type-z-a':
            orderBy = {
                type: 'desc'
            };
            break;
        case 'title-a-z':
            orderBy = {
                title: 'asc'
            };
            break;
        case 'title-z-a':
            orderBy = {
                title: 'desc'
            };
            break;
    }

    try {
        const documents = await prisma.document.findMany({
            where: whereCondition,
            orderBy: orderBy,
            skip: skip,
            take: pageSize,
            include: {
                attachment: {
                    include: {
                        document: true
                    }
                },
                linked: {
                    include: {
                        attachment: true
                    }
                }
            },
            });
        return documents;
    } catch (error) {
        console.log('Error fetching documents:', error);
        return []; // Kembalikan array kosong jika terjadi error
    }
};

const getDocumentById = async (id) => {
    try {
        const document = await prisma.document.findUnique({
            where: {
                id: id
            },
            include: {
                attachment: {
                    include: {
                        document: true
                    }
                },
                linked: {
                    include: {
                        attachment: true
                    }
                }
            },
        })
        return document
    } catch (error) {
        console.log(error)
    }
}

module.exports = { 
    getOptions,
    createDocument, 
    editDocument,
    deleteDocument,
    getTotalDocuments, 
    getTotalPages, 
    getDocument, 
    getDocumentById, 
    groupByType, 
    groupByYear 
}