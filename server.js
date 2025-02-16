const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const WebSocket = require('ws');
const http = require('http');
const { v4: uuidv4 } = require('uuid');
const {OAuth2Client} = require('google-auth-library');




// Clé secrète pour signer les tokens JWT
const saltRounds = 10;
const SECRET_KEY = fs.readFileSync(path.join(__dirname, './certs/private-key.pem'), 'utf8').trim();
const CLIENT_ID  =  "933726926443-mfo0gij5g3f8pol7a6c0icj5h3pl7rtg.apps.googleusercontent.com"
// mysql
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'neosmentis'
});

connection.connect(error => {
    if (error) throw error;
    console.log('Successfully connected to the database.');
});


const app = express();
const PORT = 80;

const server = http.createServer(app);

// Ajouter un serveur WebSocket
const wss = new WebSocket.Server({ server });
const clients = new Map();
const client = new OAuth2Client(CLIENT_ID);

const clents_status = new Map();
const clients_projects = new Map();


app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(cookieParser());


// Configurer multer pour gérer l'upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Spécifier le répertoire d'upload
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Générer un nom unique pour chaque fichier
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });


// access aux pages
app.get('/', (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        res.redirect('/log');
    } else {
        res.sendFile('./public/html/home.html', { root: __dirname })
    }
});
app.get('/test', (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        res.redirect('/log');
    } else {
        res.sendFile('./public/html/testgoogle.html', { root: __dirname })
    }
});
app.get('/editor', (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.redirect('/log');
    }

    res.sendFile('./public/html/editor3.html', { root: __dirname })
});
app.get('/agenda', (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.redirect('/log');
    }

    res.sendFile('./public/html/agenda.html', { root: __dirname })
});
app.get('/carte', (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.redirect('/log');
    }

    res.sendFile('./public/html/carte.html', { root: __dirname })
});

// requets d'upload de fichier
app.post('/uploadFile', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: 0, message: 'No file uploaded' });
    }

    // Réponse après l'upload réussi
    const fileData = {
        url: `/uploads/${req.file.filename}`,
        name: req.file.originalname,
        size: req.file.size,
        extension: path.extname(req.file.originalname).substring(1) // Sans le point
    };

    // Répondre avec les informations du fichier
    return res.json({
        success: 1,
        file: fileData
    });
});
app.use('/uploads', express.static('uploads'));

app.post('/upload_image', upload.single('image'), (req, res) => {

    let data = verificationAll(req, res);
    if (!data) {
        return res.redirect('/log');
    }

    if (!req.file) {
        return res.status(400).json({ success: 0, message: 'No file uploaded' });
    }

    connection.query('INSERT INTO images SET url = ?, user_id_link = ?', [`/uploads/${req.file.filename}`, data.userID], (error, _results) => {
        if (error) {
            return res.json({ success: 0, message: error.message });
        }

        const fileData = {
            url: `/uploads/${req.file.filename}`,
            name: req.file.originalname,
            size: req.file.size,
            extension: path.extname(req.file.originalname).substring(1)
        };

        return res.json({ success: 1, file: fileData });
    });
});
app.get('/get_user_pictures', (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.redirect('/log');
    }

    connection.query('SELECT * FROM images WHERE user_id_link = ? ORDER BY date LIMIT 100', [data.userID], (error, results) => {
        if (error) {
            return res.json({ success: false, message: error.message });
        }
        return res.json({ success: true, images: results });
    });
});
app.post('/delete_image', (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.redirect('/log');
    }

    const ImageURL = req.body.url;
    connection.query('SELECT url FROM images WHERE url = ? AND user_id_link = ?', [ImageURL, data.userID], (error, results) => {
        if (error) {
            return res.json({ success: false, message: error.message });
        }

        if (results.length === 0) {
            return res.json({ success: false, message: 'Image not found' });
        }

        const imageUrl = results[0].url;
        fs.unlink(path.join(__dirname, imageUrl), (err) => {
            if (err) {
                return res.json({ success: false, message: err.message });
            }

            connection.query('DELETE FROM images WHERE url = ? AND user_id_link = ?', [imageUrl, data.userID], (error, _results) => {
                if (error) {
                    return res.json({ success: false, message: error.message });
                }
                return res.json({ success: true, message: 'Image deleted successfully' });
            });
        });
    });
});

// requets liées aux documents
app.post('/save_document', (req, res) => {
    const content = req.body.data;
    const id = req.body.id;
    const title = req.body.title;

    let data = verificationAll(req, res);
    if (!data) {
        return res.redirect('/log');
    }

    // encrypted the content
    const secondaryKey = Buffer.from(req.cookies.secondaryKey, 'hex');

    // recuperer la clef encryptée du document
    connection.query('SELECT * FROM key_link WHERE user_id_link = ? AND document_id_link = ?', [data.userID, id], (error, results) => {
        if (error) {
            throw error;
        }
        const encryptedDocKey = results[0];
        const encryptedData = encryptDocument(content, secondaryKey, encryptedDocKey);

        const currentDate = new Date();
        currentDate.setHours(currentDate.getHours() + 1);
        const currentTimestamp = currentDate.toISOString().replace('T', ' ').substring(0, 19);
        connection.query('UPDATE documents SET content = ?, iv = ?,authTag = ?, title = ?, last_modified = ? WHERE id = ?',
            [encryptedData.encryptedData, encryptedData.iv, encryptedData.authTag, title, currentTimestamp, id, data.userID], (error, _results) => {
                if (error) {
                    return res.json({ success: false, message: error.message });
                }

                return res.json({ success: true, message: 'Document saved successfully' });
            });
    });
});
app.get('/create_document', (req, res) => {

    let data = verificationAll(req, res);
    if (!data) {
        return res.redirect('/log');
    }

    // recupérer la clef de l'utilisateur

    const secondaryKey = Buffer.from(req.cookies.secondaryKey, 'hex');
    const docIdentifier = crypto.randomBytes(32).toString('hex');

    const docKey = generateDocumentKey(SECRET_KEY, docIdentifier);

    const encryptedDocKey = encryptWithSecondaryKey(docKey.toString('hex'), secondaryKey);

    const dataEncripted = encryptDocument(' ', secondaryKey, encryptedDocKey);

    console.log("dataEncripted:", dataEncripted);
    connection.query('INSERT INTO documents SET title = "New document", user_id_link = ?, content = ? , iv = ?, authTag = ?',
        [data.userID, dataEncripted.encryptedData, dataEncripted.iv, dataEncripted.authTag], (error, _results) => {
            console.log("error:", error);
            if (error) {
                return res.json({ success: false, message: error.message });
            }
            console.log("id:", _results.insertId);
            addKeyLinkToBase(data.userID, encryptedDocKey.encryptedData, encryptedDocKey.iv, encryptedDocKey.authTag, _results.insertId);

            return res.json({ success: true, message: 'Document created successfully', id: _results.insertId });
        }
    );
});
app.post('/documents', (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.redirect('/log');
    }
    const id = req.body.id;


    connection.query('SELECT * FROM documents WHERE id = ?', [id], (error, results) => {
        if (error) {
            return res.json({ success: false, message: error.message });
        }

        if (results.length === 0) {
            return res.json({ success: false, message: 'Document not found' });
        }
        connection.query('SELECT * FROM key_link WHERE user_id_link = ? AND document_id_link = ?', [data.userID, id], (error, results_) => {
            if (error) {
                throw error;
            }
            // Decrypt the key
            const secondaryKey = Buffer.from(req.cookies.secondaryKey, 'hex');

            const decryptedContent = decryptDocument(results_[0], secondaryKey, results[0]);
            if (decryptedContent == "error") {
                return res.json({ success: false, message: 'Error while decrypting the document' });
            }    
            results[0].content = decryptedContent;

            return res.json({ success: true, documents: results });
        });
    });
});
app.get('/documents_by_user', (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.redirect('/log');
    }
    connection.query(`SELECT documents.id,documents.title,documents.last_modified 
                        FROM key_link 
                        LEFT JOIN documents ON key_link.document_id_link = documents.id
                        WHERE key_link.user_id_link = ? 
                        ORDER BY last_modified DESC`
        , [data.userID], (error, results) => {
            if (error) {
                return res.json({ success: false, message: error.message });
            }
            return res.json({ success: true, documents: results });
        });
});
app.post('/delete_document', (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.redirect('/log');
    }

    const id = req.body.id;
    connection.query('DELETE FROM documents WHERE id = ? AND user_id_link = ?', [id, data.userID], (error, _results) => {
        if (error) {
            return res.json({ success: false, message: error.message });
        }
        connection.query('DELETE FROM key_link WHERE document_id_link = ?', [id], (error, _results) => {
            if (error) {
                return res.json({ success: false, message: error.message });
            }
            return res.json({ success: true, message: 'Document deleted successfully' });
        });

    });
});

// requets liées aux projets
app.post('/partage_document', (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.redirect('/log');
    }
    const id_doc = req.body.id_doc;
    const id_user = req.body.id_user;

    connection.query('SELECT * FROM key_link WHERE user_id_link = ? AND document_id_link = ?', [data.userID, id_doc], (error, results) => {
        if (error) {
            throw error;
        }
        const encryptedDocKey = results[0];
        const decryptedDocKey = getDocumentKey(Buffer.from(req.cookies.secondaryKey, 'hex'), encryptedDocKey);

        const text = encryptTexteWithPrimaryKey(decryptedDocKey, SECRET_KEY);

        connection.query('INSERT INTO partages (document_id_link, sender_id, receiver_id, encryptedData, iv, authTag) VALUES (?, ?, ?, ?, ?, ?)',
            [id_doc, data.userID, id_user, text.encryptedData, text.iv, text.authTag], (error, _results) => {
                if (error) {
                    return res.json({ success: false, message: error.message });
                }

                return res.json({ success: true, message: 'Document shared successfully' });
            });
    });
});
app.get('/accepter_les_partages', (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.redirect('/log');
    }
    connection.query('SELECT * FROM partages WHERE receiver_id = ?', [data.userID], (error, results) => {
        if (error) {
            return res.json({ success: false, message: error.message });
        }
        if (results.length === 0) {
            return res.json({ success: true, message: 'No shared documents' });
        }

        for (let i = 0; i < results.length; i++) {
            const encryptKey = results[i];
            const decryptedKey = DecryptTexteWithPrimaryKey(encryptKey.encryptedData, SECRET_KEY, encryptKey.iv, encryptKey.authTag);

            const secondaryKey = Buffer.from(req.cookies.secondaryKey, 'hex');

            const encryptedDocKey = encryptWithSecondaryKey(decryptedKey.toString('hex'), secondaryKey);

            connection.query('INSERT INTO key_link (user_id_link, document_id_link, encryptedData, iv, authTag) VALUES (?, ?, ?, ?, ?)',
                [data.userID, encryptKey.document_id_link, encryptedDocKey.encryptedData, encryptedDocKey.iv, encryptedDocKey.authTag], (error, _results) => {
                    if (error) {
                        return res.json({ success: false, message: error.message });
                    }
                    connection.query('DELETE FROM partages WHERE id_partage = ?', [encryptKey.id_partage], (error, _results) => {
                        if (error) {
                            return res.json({ success: false, message: error.message });
                        }
                    });
                });
        }
        return res.json({ success: true, message: 'Documents shared successfully' });
    });
});

// requets liées aux connexions
app.get('/log', (req, res) => {
    res.sendFile('./public/html/log.html', { root: __dirname })
});
app.post('/register', async (req, res) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;

    const hash = await hashPassword(password);
    connection.query('INSERT INTO users (user_name, email, user_password) VALUES (?, ?, ?)',
        [username, email, hash], (error, results) => {
            if (error) {
                return res.json({ success: false, message: error.message });
            }
            connection.query('INSERT INTO user_settings (user_id_link) VALUES (?)', [results.insertId], (error, _results) => {
                if (error) {
                    return res.json({ success: false, message: error.message });
                }
                console.log('User registered successfully');
                // create a secondary key
                const secondaryKey = generateSecondaryKey(SECRET_KEY, password);
                // create a token
                const token = generateToken(username, results.insertId);
                // set the token in the cookie
                res.cookie('token', token, { httpOnly: true });
                // set the secondary key in the cookie
                res.cookie('secondaryKey', secondaryKey.toString('hex'), { httpOnly: true });
                res.cookie('username', username, { httpOnly: true });
                return res.json({ success: true, message: 'User registered successfully' });
            });

        });
});
app.post('/login', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    connection.query('SELECT * FROM users WHERE user_name = ?', [username], async (error, results) => {
        if (error) {
            return res.json({ success: false, message: error.message });
        }

        if (results.length === 0) {
            return res.json({ success: false, message: 'User not found' });
        }

        const match = await verifyPassword(password, results[0].user_password);
        if (!match) {
            return res.json({ success: false, message: 'Invalid password' });
        }

        // create a secondary key
        const secondaryKey = generateSecondaryKey(SECRET_KEY, password);
        // create a token
        const token = generateToken(username, results[0].user_id);
        // set the token in the cookie  
        res.cookie('token', token, { httpOnly: true });
        // set the secondary key in the cookie
        res.cookie('secondaryKey', secondaryKey.toString('hex'), { httpOnly: true });

        res.cookie('username', username, { httpOnly: true });

        return res.json({ success: true, message: 'User logged in successfully' });
    });
});
app.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.clearCookie('secondaryKey');
    res.clearCookie('username');
    res.redirect('/log');
});
app.post('/register_with_google', (req, res) => {
    const credential = req.body.credential;

    const username = JSON.parse(Buffer.from(credential.split('.')[1], 'base64').toString()).name;
    
    const email = JSON.parse(Buffer.from(credential.split('.')[1], 'base64').toString()).email;
    const sub = JSON.parse(Buffer.from(credential.split('.')[1], 'base64').toString()).sub;

    const sub_hash = crypto.createHash('sha256').update(sub).digest('hex');

    connection.query('SELECT * FROM users WHERE user_password = ?', [sub_hash], async (error, results) => {
        if (error) {
            return res.json({ success: false, message: error.message });
        }

        if (results.length === 0) {
            connection.query('INSERT INTO users (user_name, email, user_password) VALUES (?, ?, ?)',
                [username, email, sub_hash], (error, results) => {
                    if (error) {
                        return res.json({ success: false, message: error.message });
                    }
                    connection.query('INSERT INTO user_settings (user_id_link) VALUES (?)', [results.insertId], (error, _results) => {
                        if (error) {
                            return res.json({ success: false, message: error.message });
                        }
                        console.log('User registered successfully');
                        // create a secondary key
                        const secondaryKey = generateSecondaryKey(SECRET_KEY, sub_hash);
                        // create a token
                        const token = generateToken(username, results.insertId);
                        // set the token in the cookie
                        res.cookie('token', token, { httpOnly: true });
                        // set the secondary key in the cookie
                        res.cookie('secondaryKey', secondaryKey.toString('hex'), { httpOnly: true });
                        res.cookie('username', username, { httpOnly: true });
                        res.cookie('credential', credential, { httpOnly: true });
                        return res.json({ success: true, message: 'User registered successfully' });
                    });

                });
        } else {
            // create a secondary key
            const secondaryKey = generateSecondaryKey(SECRET_KEY, sub_hash);
            // create a token
            const token = generateToken(username, results[0].user_id);
            // set the token in the cookie  
            res.cookie('token', token, { httpOnly: true });
            // set the secondary key in the cookie
            res.cookie('secondaryKey', secondaryKey.toString('hex'), { httpOnly: true });

            res.cookie('username', username, { httpOnly: true });
            res.cookie('sub', sub, { httpOnly: true });
            return res.json({ success: true, message: 'User logged in successfully' });
        }
    }
    );


});
app.get('/login_with_google_sub', (req, res) => {

    if (!req.cookies.sub) {
        return res.json({ success: false, message: 'No token found' });
    }
    const credential = req.cookies.credential;

    try{
        const sub = JSON.parse(Buffer.from(credential.split('.')[1], 'base64').toString()).sub;
        const sub_hash = crypto.createHash('sha256').update(sub).digest('hex');

    }catch(e){
        return res.json({ success: false, message: 'Invalid token' });
    }


    // verifier le sub au près de google 
    verifyGoogleToken(credential).then(result => {
        if (!result) {
            return res.json({ success: false, message: 'Invalid token' });
        }
        else {
            connection.query('SELECT * FROM users WHERE user_password = ?', [sub_hash], async (error, results) => {
                if (error) {
                    return res.json({ success: false, message: error.message });
                }

                if (results.length === 0) {
                    return res.json({ success: false, message: 'User not found' });
                }


                // create a secondary key
                const secondaryKey = generateSecondaryKey(SECRET_KEY, sub);
                // create a token
                const token = generateToken(results[0].user_name, results[0].user_id);
                // set the token in the cookie
                res.cookie('token', token, { httpOnly: true });
                // set the secondary key in the cookie
                res.cookie('secondaryKey', secondaryKey.toString('hex'), { httpOnly: true });

                res.cookie('username', results[0].user_name, { httpOnly: true });
                res.cookie('credential', credential, { httpOnly: true });
                return res.json({ success: true, message: 'User logged in successfully' });
            });
        }
    });
});

// requets liées aux infos de l'utilisateur
app.get('/get_all_user_info', (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.redirect('/log');
    }

    let currentDate = new Date();
    let twoWeeksLater = new Date();
    twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
    twoWeeksLater.setHours(23, 59, 59, 999);
    twoWeeksLater = twoWeeksLater.toISOString().slice(0, 19).replace('T', ' ');

    connection.query('SELECT home_settings,style_settings FROM user_settings WHERE user_id_link = ?', [data.userID], async (error, results) => {
        if (error) {
            return res.json({ success: false, message: error.message });
        }
        if (results.length === 0) {
            return res.json({ success: true, data: data });
        }
        results[0].home_settings = JSON.parse(results[0].home_settings);
        results[0].style_settings = JSON.parse(results[0].style_settings);
        connection.query(
            "SELECT *, CONVERT_TZ(startTime, '+00:00', '+01:00') as startTime, CONVERT_TZ(endTime, '+00:00', '+01:00') as endTime FROM agenda_events WHERE user_id_link = ? AND endTime BETWEEN ? AND ? ORDER BY startTime",
            [data.userID, currentDate, twoWeeksLater],
            (error, results__) => {
                if (error) {
                    return res.json({ success: false, message: error.message });
                }
                connection.query(
                    `SELECT documents.id,documents.title,documents.last_modified 
                     FROM key_link 
                     LEFT JOIN documents ON key_link.document_id_link = documents.id
                     WHERE key_link.user_id_link = ? 
                     ORDER BY last_modified DESC`,
                    [data.userID],
                    (error, resultsDocs) => {
                        if (error) {
                            return res.json({
                                success: true,
                                data: data,
                                settings: results[0],
                                events: results__,
                                documents: [],
                                projects: []
                            });
                        }
                        connection.query(
                            `SELECT projects_key_link.project_id_link as id, projects.title, projects.last_modified
                             FROM projects_key_link
                             LEFT JOIN projects ON projects_key_link.project_id_link = projects.id_project 
                             WHERE projects_key_link.user_id_link = ?`,
                            [data.userID],
                            (error, resultsPro) => {
                                if (error) {
                                    return res.json({
                                        success: true,
                                        data: data,
                                        settings: results[0],
                                        events: results__,
                                        documents: resultsDocs,
                                        projects: []
                                    });
                                }
                                connection.query(
                                    `SELECT users.user_id as id, users.user_name as name, users.email as email 
                                     FROM users_link 
                                     LEFT JOIN users ON (users_link.user2 = users.user_id AND users_link.user1 = ?) 
                                        OR (users_link.user1 = users.user_id AND users_link.user2 = ?)
                                     WHERE users.user_id != ?`,
                                    [data.userID, data.userID, data.userID],
                                    (error, resultsCol) => {
                                        if (error) {
                                            return res.json({
                                                success: true,
                                                data: data,
                                                settings: results[0],
                                                events: results__,
                                                documents: resultsDocs,
                                                projects: resultsPro,
                                                collaborators: []
                                            });
                                        }
                                        return res.json({
                                            success: true,
                                            data: data,
                                            settings: results[0],
                                            events: results__,
                                            documents: resultsDocs,
                                            projects: resultsPro,
                                            collaborators: resultsCol   
                                        });
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    });
});
app.get('/get_all_user_info_only', (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.redirect('/log');
    }

    connection.query('SELECT user_name as username FROM users WHERE user_id = ?', [data.userID], (error, results) => {
        if (error) {
            return res.json({ success: false, message: error.message });
        }
        if (results.length === 0) {
            return res.json({ success: false, message: 'User not found' });
        }
        return res.json({ success: true, data: results[0]});
    });
});

// requets liées aux agendas
app.get('/agenda/agenda_events', (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.redirect('/log');
    }

    connection.query("SELECT *, CONVERT_TZ(startTime, '+00:00', '+01:00') as startTime, CONVERT_TZ(endTime, '+00:00', '+01:00') as endTime FROM agenda_events WHERE user_id_link = ?", [data.userID], (error, results) => {
        if (error) {
            return res.json({ success: false, message: error.message });
        }
        // Group events by date
        const groupedEvents = results.reduce((acc, event) => {
            const date = event.startTime.toISOString().split('T')[0];
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push({
                id: "ev" + event.id_event.toString(),
                title: event.title,
                startTime: event.startTime,
                endTime: event.endTime,
                group: event.group_id_link,
                color: event.color,
                linkedItems: JSON.parse(event.linkedItems || '{"notes":[],"sections":[]}'),
                location: event.location,
                description: event.description
            });
            return acc;
        }, {});
        return res.json({ success: true, events: groupedEvents });
    });
}); 
app.post('/agenda/save_agenda_event', (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.redirect('/log');
    }
    const id = req.body.id;
    const title = req.body.title;
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    const group = req.body.group;
    const color = req.body.color;
    const linkedItems = JSON.stringify(req.body.linkedItems);
    const location = req.body.location;
    const description = req.body.description;
    if (id) {
        connection.query("UPDATE agenda_events SET title = ?, startTime = ?, endTime = ?, group_id_link = ?, color = ?, linkedItems = ?, location = ?, description = ? WHERE id_event = ? AND user_id_link = ?",
            [title, startDate, endDate, group, color, linkedItems, location, description, id, data.userID], (error, _results) => {
                if (error) {
                    return res.json({ success: false, message: error.message });
                }
                return res.json({ success: true, message: 'Event updated successfully' });
            });
    } else {
        connection.query("INSERT INTO agenda_events (title, startTime, endTime, group_id_link, color, linkedItems, location, description, user_id_link) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [title, startDate, endDate, group, color, linkedItems, location, description, data.userID], (error, _results) => {
                if (error) {
                    return res.json({ success: false, message: error.message });
                }
                return res.json({ success: true, message: 'Event created successfully' });
            });
    }
});
app.post('/agenda/delete_agenda_event', (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.redirect('/log');
    }
    const id = req.body.id;
    connection.query("DELETE FROM agenda_events WHERE id_event = ? AND user_id_link = ?", [id, data.userID], (error, _results) => {
        if (error) {
            return res.json({ success: false, message: error.message });
        }
        return res.json({ success: true, message: 'Event deleted successfully' });
    });
});
app.get('/agenda/2weeks', (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
    }
    let currentDate = new Date();
    currentDate.setHours(0, 1, 0, 0);
    currentDate = currentDate.toISOString().slice(0, 19).replace('T', ' ');
    let twoWeeksLater = new Date();
    twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
    twoWeeksLater.setHours(23, 59, 59, 999);
    twoWeeksLater = twoWeeksLater.toISOString().slice(0, 19).replace('T', ' ');

    connection.query("SELECT *, CONVERT_TZ(startTime, '+00:00', '+01:00') as startTime, CONVERT_TZ(endTime, '+00:00', '+01:00') as endTime FROM agenda_events WHERE user_id_link = ? AND startTime BETWEEN ? AND ? ORDER BY startTime",
        [data.userID, currentDate, twoWeeksLater], (error, results) => {
            if (error) {
                return res.json({ success: false, message: error.message });
            }
            return res.json({ success: true, events: results });
        });
});

// requets liées aux projets
app.post('/carte/save_carte_settings', (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.redirect('/log');
    }
    try {
        const carte_connections = JSON.stringify(req.body.carte_connections);
        const carte_blocs = JSON.stringify(req.body.carte_blocs);

        connection.query(`UPDATE projects 
                            JOIN projects_key_link ON projects.id_project = projects_key_link.project_id_link 
                            SET projects.settings_connection = ?, projects.settings_bloc = ? 
                            WHERE projects_key_link.user_id_link = ?`,
            [carte_connections, carte_blocs, data.userID], (error) => {
                if (error) {
                    return res.json({ success: false, message: error.message });
                }

                return res.json({ success: true, message: 'Settings saved successfully' });
            });
    } catch (error) {
        return res.json({ success: false, message: 'Invalid data format' });
    }
});
app.get('/carte/get_carte_settings', (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.redirect('/log');
    }
    connection.query(`SELECT projects.settings_connection, projects.settings_bloc ,projects.date_start
                        FROM projects 
                        JOIN projects_key_link ON projects.id_project = projects_key_link.project_id_link 
                        WHERE projects_key_link.user_id_link = ?`, [data.userID], (error, results) => {
        if (error) {
            return res.json({ success: false, message: error.message });
        }

        if (results.length === 0) {
            return res.json({ success: true, data: {} });
        }

        return res.json({ success: true, data: results[0] });
    });
});
app.post('/carte/delete_task', (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.redirect('/log');
    }
    const id = req.body.id;
    const id_project = req.body.id_project;
    connection.query('DELETE FROM tasks WHERE id_tache = ? AND project_id_link = ?', [id,id_project], (error, _results) => {
        if (error) {
            return res.json({ success: false, message: error.message });
        }
        return res.json({ success: true, message: 'Event deleted successfully' });
    });
});
app.post('/carte/add_task', (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.redirect('/log');
    }
    const title = req.body.title;
    const description = req.body.description;
    const id_project = req.body.id_project;
    const duree_theorique = req.body.duree_theorique;
    const pourcentage_avancemennt = req.body.pourcentage_avancemennt;
    const contributeurs = req.body.contributeurs;
    const materiels = req.body.materiels;
    const link_ressources = req.body.link_ressources;
    const etat = req.body.etat;


    connection.query('INSERT INTO tasks (title, description, project_id_link,duree_theorique,pourcentage_avancemennt,contributeurs,materiels,link_ressources,etat) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [title, description, id_project, duree_theorique, pourcentage_avancemennt, contributeurs, materiels, link_ressources, etat], (error, _results) => {
            if (error) {
                return res.json({ success: false, message: error.message });
            }
            // recupère les données de la task
            connection.query('SELECT * FROM tasks WHERE project_id_link = ? AND id_tache = ?', [id_project, _results.insertId], (error, results) => {
                if (error) {
                    return res.json({ success: false, message: error.message });
                }
                return res.json({ success: true, tasks: results });
            });
        });
});
app.post('/carte/get_all_project_tasks', (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.redirect('/log');
    }
    const id_project = req.body.id_project;
    connection.query('SELECT * FROM tasks WHERE project_id_link = ?', [id_project], (error, results) => {
        if (error) {
            return res.json({ success: false, message: error.message });
        }
        return res.json({ success: true, tasks: results });
    });
});
app.post('/carte/update_task', (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.redirect('/log');
    }
    const id = req.body.id;
    const title = req.body.title;
    const description = req.body.description;
    const duree_theorique = req.body.duree_theorique;
    const pourcentage_avancemennt = req.body.pourcentage_avancemennt;
    const contributeurs = req.body.contributeurs;
    const materiels = req.body.materiels;
    const link_ressources = req.body.link_ressources;
    const etat = req.body.etat;

    connection.query('UPDATE tasks SET title = ?, description = ?, duree_theorique = ?, pourcentage_avancemennt = ?, contributeurs = ?, materiels = ?, link_ressources = ?, etat = ? WHERE id_tache = ?',
        [title, description, duree_theorique, pourcentage_avancemennt, contributeurs, materiels, link_ressources, etat, id], (error, _results) => {
            if (error) {
                return res.json({ success: false, message: error.message });
            }
            return res.json({ success: true, message: 'Task updated successfully' });
        });
});
app.post('/carte/delete_task', (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.redirect('/log');
    }
    const id_task = req.body.id_task;
    const id_project = req.body.id_project;
    connection.query('DELETE FROM tasks WHERE id_tache = ? AND project_id_link = ?', [id_task, id_project], (error, _results) => {
        if (error) {
            return res.json({ success: false, message: error.message });
        }
        return res.json({ success: true, message: 'Task deleted successfully' });
    });
});
app.get('/carte/get_all_projects_by_user', (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.redirect('/log');
    }
    connection.query(`SELECT projects_key_link.project_id_link as id, projects.title, projects.description, projects.last_modified
                    FROM projects_key_link
                    LEFT JOIN projects ON projects_key_link.project_id_link = projects.id_project 
                    WHERE projects_key_link.user_id_link = ?`, [data.userID], (error, results) => {
        if (error) {
            return res.json({ success: false, message: error.message });
        }
        return res.json({ success: true, projects: results });
    });
});
app.post('/carte/add_contributor_to_task', (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.redirect('/log');
    }
    const id_task = req.body.id_task;
    const id_project = req.body.id_project;
    const id_user = req.body.id_collaborator;

    connection.query('SELECT * FROM tasks_key_link WHERE task_id_link = ? AND user_id_link = ? AND project_id_link = ?', [id_task, id_user, id_project], (error, results) => {
        if (error) {
            return res.json({ success: false, message: error.message });
        }

        if (results.length > 0) {
            return res.json({ success: false, message: 'Contributor already exists' });
        }else{

            connection.query('INSERT INTO tasks_key_link (task_id_link, user_id_link,project_id_link) VALUES (?, ?, ?)', [id_task, id_user, id_project], (error, _results) => {
                if (error) {
                    return res.json({ success: false, message: error.message });
                }
        
                connection.query('SELECT * FROM projects_key_link WHERE project_id_link = ? AND user_id_link = ?', [id_project, id_user], (error, results) => {
                    if (error) {
                        return res.json({ success: false, message: error.message });
                    }
        
                    if (results.length === 0) {
                        connection.query('INSERT INTO projects_key_link (project_id_link, user_id_link) VALUES (?, ?)', [id_project, id_user], (error, _results) => {
                            if (error) {
                                return res.json({ success: false, message: error.message });
                            }
                            return res.json({ success: true, message: 'Contributor added successfully' });
                        });
                    } else {
                        return res.json({ success: true, message: 'Contributor added successfully' });
                    }
                });
            });
        }
    });
});
app.post('/carte/get_collaborator_by_task', (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.redirect('/log');
    }
    const id_task = req.body.id_task;
    connection.query(`SELECT users.user_id as id, users.user_name as name, users.email 
                    FROM tasks_key_link 
                    LEFT JOIN users ON tasks_key_link.user_id_link = users.user_id
                    WHERE tasks_key_link.task_id_link = ?`, [id_task], (error, results) => {
        if (error) {
            return res.json({ success: false, message: error.message });
        }
        return res.json({ success: true, collaborators: results });
    });
});
app.get('/carte/create_project', (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.redirect('/log');
    }
    let title = 'Nouveau projet' + Math.floor(Math.random() * 1000);
    connection.query('INSERT INTO projects (title) VALUES (?)', [title], (error, results) => {
        if (error) {
            return res.json({ success: false, message: error.message });
        }
        connection.query('INSERT INTO projects_key_link (project_id_link, user_id_link) VALUES (?, ?)', [results.insertId, data.userID], (error, _results) => {
            if (error) {
                return res.json({ success: false, message: error.message });
            }
            return res.json({ success: true, message: 'Project created successfully', id: results.insertId });
        });
    });
});


// requets liées aux collaborateurs
app.get('/get_all_collaborators_of_one_user', (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.redirect('/log');
    }
    connection.query(`SELECT users.user_id as id, users.user_name as name, users.email as email 
                    FROM users_link 
                    LEFT JOIN users ON (users_link.user2 = users.user_id AND users_link.user1 = ?) OR (users_link.user1 = users.user_id AND users_link.user2 = ?)
                    WHERE users.user_id != ?`
        , [data.userID, data.userID, data.userID], (error, results) => {
            if (error) {
                return res.json({ success: false, message: error.message });
            }
            return res.json({ success: true, collaborators: results });
        });
});
app.post('/recherche_collaborators', (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.redirect('/log');
    }
    const search = req.body.search;
    connection.query(`SELECT users.user_id as id, users.user_name as name, users.email as email 
                    FROM users_link 
                    LEFT JOIN users ON (users_link.user2 = users.user_id AND users_link.user1 = ?) OR (users_link.user1 = users.user_id AND users_link.user2 = ?)
                    WHERE users.user_name LIKE ? AND users.user_id != ?`
        , [data.userID, data.userID, '%' + search + '%', data.userID], (error, results) => {
            if (error) {
                return res.json({ success: false, message: error.message });
            }
            return res.json({ success: true, collaborators: results });
        });
});
app.post('/rechercher_user', (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.redirect('/log');
    }
    const search = req.body.search;
    connection.query(`SELECT user_id as id, user_name as name, email
                    FROM users
                    WHERE user_name LIKE ? AND user_id != ?`
        , ['%' + search + '%', data.userID], (error, results) => {
            if (error) {
                return res.json({ success: false, message: error.message });
            }
            return res.json({ success: true, users: results });
        });
});
app.post('/add_collaborator', (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.redirect('/log');
    }
    const id_user = req.body.collaborator;

    // Vérifier si le collaborateur existe déjà
    connection.query('SELECT * FROM users_link WHERE (user1 = ? AND user2 = ?) OR (user1 = ? AND user2 = ?)',
        [data.userID, id_user, id_user, data.userID], (error, results) => {
            if (error) {
                return res.json({ success: false, message: error.message });
            }
            if (results.length > 0) {
                return res.json({ success: false, message: 'Collaborator already exists' });
            }

            // Ajouter le collaborateur s'il n'existe pas déjà
            connection.query('INSERT INTO users_link (user1, user2) VALUES (?, ?)', [data.userID, id_user], (error, _results) => {
                if (error) {
                    return res.json({ success: false, message: error.message });
                }
                return res.json({ success: true, message: 'Collaborator added successfully' });
            });
        });
});
app.post('/request_add_collaborator', (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.redirect('/log');
    }
    const id_user = req.body.collaborator;

    // Vérifier si le collaborateur existe déjà
    connection.query('SELECT * FROM request_link_user WHERE (user1 = ? AND user2 = ?) OR (user1 = ? AND user2 = ?)',
        [data.userID, id_user, id_user, data.userID], (error, results) => {
            if (error) {
                return res.json({ success: false, message: error.message });
            }
            if (results.length > 0) {
                return res.json({ success: false, message: 'Request already sent' });
            }

            // Ajouter le collaborateur s'il n'existe pas déjà
            connection.query('INSERT INTO request_link_user (user1, user2) VALUES (?, ?)', [data.userID, id_user], (error, _results) => {
                if (error) {
                    return res.json({ success: false, message: error.message });
                }
                return res.json({ success: true, message: 'Request sent successfully' });
            });
        });
});
app.get('/have_request_collaborator', (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.redirect('/log');
    }
    connection.query(`SELECT users.user_id as id, users.user_name as name, users.email as email ,request_link_user.id as id_request 
                    FROM request_link_user 
                    LEFT JOIN users ON request_link_user.user1 = users.user_id
                    WHERE request_link_user.user2 = ?`, [data.userID], (error, results) => {
        if (error) {
            return res.json({ success: false, message: error.message });
        }
        return res.json({ success: true, requests: results });
    }
    );
});
app.post('/accept_request_collaborator', (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.redirect('/log');
    }
    const id_request = req.body.id_request;

    connection.query('SELECT * FROM request_link_user WHERE id = ?', [id_request], (error, results) => {
        if (error) {
            return res.json({ success: false, message: error.message });
        }
        if (results.length === 0) {
            return res.json({ success: false, message: 'Request not found' });
        }
        const id_user = results[0].user1;
        connection.query('INSERT INTO users_link (user1, user2) VALUES (?, ?)', [id_user, data.userID], (error, _results) => {
            if (error) {
                return res.json({ success: false, message: error.message });
            }
            connection.query('DELETE FROM request_link_user WHERE id = ?', [id_request], (error, _results) => {
                if (error) {
                    return res.json({ success: false, message: error.message });
                }
                return res.json({ success: true, message: 'Request accepted successfully' });
            });
        });
    });
});
app.post('/accept_request_collaborator_by_id_user', (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.redirect('/log');
    }
    const id_user = req.body.id_user;

    connection.query('SELECT * FROM request_link_user WHERE user1 = ? AND user2 = ?', [id_user, data.userID], (error, results) => {
        if (error) {
            return res.json({ success: false, message: error.message });
        }
        if (results.length === 0) {
            return res.json({ success: false, message: 'Request not found' });
        }
        connection.query('INSERT INTO users_link (user1, user2) VALUES (?, ?)', [id_user, data.userID], (error, _results) => {
            if (error) {
                return res.json({ success: false, message: error.message });
            }
            connection.query('DELETE FROM request_link_user WHERE user1 = ? AND user2 = ?', [id_user, data.userID], (error, _results) => {
                if (error) {
                    return res.json({ success: false, message: error.message });
                }
                return res.json({ success: true, message: 'Request accepted successfully' });
            });
        });
    });    
});
// app.listen(PORT, () => {
//     console.log(`Serveur démarré sur http://localhost:${PORT}`);
// });


function addKeyLinkToBase(user_id, key, iv, auth, id_doc) {
    connection.query('INSERT INTO key_link (user_id_link,document_id_link, encryptedData, iv, authTag) VALUES (?, ?, ?, ?, ?)',
        [user_id, id_doc, key, iv, auth], (error, _results) => {
            if (error) {
                throw error;
            }
        });
}


// fonction de hashage du mot de passe
async function hashPassword(password) {
    const hash = await bcrypt.hash(password, saltRounds);
    return hash;
}

// fonction de vérification du mot de passe
async function verifyPassword(password, hash) {
    const match = await bcrypt.compare(password, hash);
    return match;
}

// Fonction pour générer un token JWT
function generateToken(name, id) {
    const payload = {
        username: name,
        userID: id,
        role: "admin"
    };
    const options = {};
    return jwt.sign(payload, SECRET_KEY, options);
}

// Fonction pour vérifier un token JWT
function verifyToken(token) {
    try {
        return jwt.verify(token, SECRET_KEY); // Vérifie le token et retourne son contenu décodé si valide
    } catch (error) {
        return null; // Retourne null si le token est invalide ou expiré
    }
}

// fonction pour tout verifier
function verificationAll(req, res) {
    // get le token 
    const token = req.cookies.token;

    const credential = req.cookies.credential;
    if (credential) {
        verifyGoogleToken(credential).then(result => {
            if (!result) {
                return false;
            }
        });
    }

    
    //get la clé secondaire
    const secondaryKey = req.cookies.secondaryKey;

    if (!token) {
        return false;
    } else if (!secondaryKey) {
        return false;
    }

    const data = verifyToken(token);
    if (!data) {
        return false;
    }

    if (data) {
        const now = new Date();
        const expirationTime = now.getTime() + (60 * 60 * 1000); // 1 hour from now
        res.cookie('token', token, { httpOnly: true, expires: new Date(expirationTime) });
        res.cookie('secondaryKey', secondaryKey, { httpOnly: true, expires: new Date(expirationTime) });
        res.cookie('username', data.username, { httpOnly: true, expires: new Date(expirationTime) });
    }

    return data;
}

function encryptTexteWithPrimaryKey(text, primaryKey) {
    const iv = crypto.randomBytes(16); // Génère un IV aléatoire
    const key = crypto.createHash('sha256').update(primaryKey).digest(); // Hash the primary key to ensure it is 256 bits
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex'); // Tag pour vérifier l'intégrité du chiffrement

    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted,
        authTag: authTag
    };
}

function DecryptTexteWithPrimaryKey(encryptedData, primaryKey, iv, authTag) {
    const key = crypto.createHash('sha256').update(primaryKey).digest(); // Hash the primary key to ensure it is 256 bits
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

function getDocumentKey(userSecondaryKey, encryptedDocKey) {
    const decipherKey = crypto.createDecipheriv(
        'aes-256-gcm',
        userSecondaryKey,
        Buffer.from(encryptedDocKey.iv, 'hex')
    );
    decipherKey.setAuthTag(Buffer.from(encryptedDocKey.authTag, 'hex'));

    let docKey = decipherKey.update(encryptedDocKey.encryptedData, 'hex', 'utf8');
    docKey += decipherKey.final('utf8');
    return docKey;
}

// Fonction pour générer une clé secondaire à partir de la clé primaire et du mot de passe
function generateSecondaryKey(primaryKey, password) {
    const salt = crypto.createHash('sha256').update(primaryKey).digest('hex'); // Utiliser une valeur unique pour chaque clé primaire
    return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256'); // Génère une clé de 32 octets (256 bits)
}

// Fonction pour chiffrer le texte avec la clé secondaire
function encryptWithSecondaryKey(text, secondaryKey) {
    const iv = crypto.randomBytes(16); // Génère un IV aléatoire
    const cipher = crypto.createCipheriv('aes-256-gcm', secondaryKey, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex'); // Tag pour vérifier l'intégrité du chiffrement

    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted,
        authTag: authTag
    };
}

function encryptDocument(text, userSecondaryKey, encryptedDocKey) {
    // 1) Déchiffrer la clé du document avec la clé secondaire de l’utilisateur
    const decipherKey = crypto.createDecipheriv(
        'aes-256-gcm',
        userSecondaryKey,
        Buffer.from(encryptedDocKey.iv, 'hex')
    );
    decipherKey.setAuthTag(Buffer.from(encryptedDocKey.authTag, 'hex'));

    let docKey = decipherKey.update(encryptedDocKey.encryptedData, 'hex', 'utf8');
    docKey += decipherKey.final('utf8');

    // 2) Chiffrer le texte avec la clé du document
    const iv = crypto.randomBytes(16); // Génère un IV aléatoire
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(docKey, 'hex'), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted,
        authTag: authTag
    };
}

function generateDocumentKey(primaryKey, docIdentifier) {
    // Ajout d'une valeur aléatoire sécurisée
    const randomValue = crypto.randomBytes(16).toString('hex');
    // Combine primaryKey + docIdentifier + valeur aléatoire
    return crypto.createHash('sha256').update(primaryKey + docIdentifier + randomValue).digest();
}

function decryptDocument(encryptedDocKey, userSecondaryKey, encryptedData) {
    // console.log("encryptedDocKey:", encryptedDocKey);
    // console.log("userSecondaryKey:", userSecondaryKey);
    // console.log("encryptedData:", encryptedData);

    if (!encryptedDocKey.iv || !encryptedDocKey.authTag || !encryptedDocKey.encryptedData) {
        throw new Error("Invalid encryptedDocKey format");
    }

    if (!encryptedData.iv || !encryptedData.authTag || !encryptedData.content) {
        console.error("encryptedData IV:", encryptedData.iv);
        console.error("encryptedData auth:", encryptedData.authTag);
        console.error("encryptedData content:", encryptedData.content);
        throw new Error("Invalid encryptedData format");
    }

    // 1) Déchiffrer la clé du document avec la clé secondaire de l’utilisateur
    const decipherKey = crypto.createDecipheriv(
        'aes-256-gcm',
        userSecondaryKey,
        Buffer.from(encryptedDocKey.iv, 'hex')
    );
    decipherKey.setAuthTag(Buffer.from(encryptedDocKey.authTag, 'hex'));

    let docKey = decipherKey.update(encryptedDocKey.encryptedData, 'hex', 'utf8');

    try{
        docKey += decipherKey.final('utf8');
    }
    catch (error) {
        return "error";
    }

    // 2) Déchiffrer le texte avec la clé du document
    const decipherData = crypto.createDecipheriv(
        'aes-256-gcm',
        Buffer.from(docKey, 'hex'),
        Buffer.from(encryptedData.iv, 'hex')
    );
    decipherData.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

    let decrypted = decipherData.update(encryptedData.content, 'hex', 'utf8');
    decrypted += decipherData.final('utf8');
    return decrypted;
}

async function verifyGoogleToken(idToken) {
    try{
        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: CLIENT_ID,  // Peut être un tableau d'IDs pour plus de sécurité
        });
        const payload = ticket.getPayload();

        return payload;
    }catch(error){
        return null;
    }
    
    // Tu peux maintenant récupérer les informations supplémentaires de Google People API
}

// Fonction pour déchiffrer le texte avec la clé secondaire
function decryptWithSecondaryKey(encryptedData, secondaryKey, iv, authTag) {
    const decipher = crypto.createDecipheriv('aes-256-gcm', secondaryKey, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}


function sendNotification(clientId, message) {
    const client = clients.get(clientId);
    if (client) {
        client.send(JSON.stringify({ type: 'notification', message }));
    } else {
        console.log(`Client avec ID ${clientId} non trouvé.`);
    }
}


wss.on('connection', (ws) => {
    // Générer un ID unique pour le client
    const clientId = uuidv4();
    clients.set(clientId, ws);
    console.log(`Client connecté avec ID : ${clientId}`);

    // Informer le client de son ID
    ws.send(JSON.stringify({ type: 'welcome', clientId }));

    // Gérer les messages reçus
    ws.on('message', (message) => {
        const parsedMessage = JSON.parse(message);
        const senderID = parsedMessage.from;

        if (parsedMessage.type === 'connection_to_project') {
            // clents_status.set(clientId, parsedMessage.message);
            clients_projects.set(clientId, parsedMessage.message);
            console.log(clients_projects);
        }
        if (parsedMessage.type === 'modification') {
            clents_status.forEach((value, key) => {
                if (value === parsedMessage.doc) {
                    if (key !== clientId) {
                        const client = clients.get(key);
                        if (client) {
                            client.send(JSON.stringify({ type: 'modification_text', from: clientId, message: parsedMessage.message }));
                        }
                    }
                }
            });
        }
        if (parsedMessage.type === 'cursor_move') {
            clents_status.forEach((value, key) => {
                if (value === parsedMessage.doc) {
                    if (key !== clientId) {
                        const client = clients.get(key);
                        if (client) {
                            client.send(JSON.stringify({ type: 'cursor_move', from: clientId, message: parsedMessage.message }));
                        }
                    }
                }
            });
        }

        if (parsedMessage.type === 'update_project') {

            var project_id_from = clients_projects.get(clientId);


            clients_projects.forEach((value, key) => {
                if (value === project_id_from) {
                    if (key !== clientId) {
                        console.log(key);
                        const client = clients.get(key);
                        if (client) {
                            client.send(JSON.stringify({ type: 'update_project', from: clientId, message: "update" }));
                        }
                    }
                }
            });
        }

        // afficher tout les clents_status qui ont parsedMessage.message = "43"


        // Exemple : Diffuser à tous les clients sauf l'émetteur
        // const parsedMessage = JSON.parse(message);
        // if (parsedMessage.type === 'broadcast') {
        //     clients.forEach((client, id) => {
        //         if (id !== clientId) {   
        //             client.send(
        //                 JSON.stringify({
        //                     type: 'broadcast',
        //                     from: clientId,
        //                     message: parsedMessage.message,
        //                 })
        //             );
        //         }
        //     });
        // }
    });

    // Gérer la déconnexion
    ws.on('close', () => {
        console.log(`Client déconnecté : ${clientId}`);
        clients.delete(clientId);
        clents_status.delete(clientId);
        clients_projects.delete(clientId);
    });
});

server.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
