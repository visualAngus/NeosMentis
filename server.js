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


// Clé secrète pour signer les tokens JWT
const saltRounds = 10;
const SECRET_KEY = fs.readFileSync(path.join(__dirname, './certs/private-key.pem'), 'utf8').trim();
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
const PORT = 3000;

const server = http.createServer(app);

// Ajouter un serveur WebSocket
const wss = new WebSocket.Server({ server });
const clients = new Map();

const clents_status = new Map();

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



app.get('/', (req, res) => {
    let data = verificationAll(req,res);
    if (!data) {
        res.redirect('/log');
    } else {
        res.sendFile('./public/html/home.html', { root: __dirname })
    }
});

app.get('/editor', (req, res) => {
    let data = verificationAll(req,res);
    if (!data) {
        return res.redirect('/log');
    }

    res.sendFile('./public/html/editor.html', { root: __dirname })
});
app.get('/editor2', (req, res) => {
    let data = verificationAll(req,res);
    if (!data) {
        return res.redirect('/log');
    }

    res.sendFile('./public/html/editorv2.html', { root: __dirname })
});
app.get('/agenda', (req, res) => {
    let data = verificationAll(req,res);
    if (!data) {
        return res.redirect('/log');
    }

    res.sendFile('./public/html/agenda.html', { root: __dirname })
});

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


app.post('/save_document', (req, res) => {
    const content = req.body.data;
    const id = req.body.id;
    const title = req.body.title;

    let data = verificationAll(req,res);
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
    let data = verificationAll(req,res);
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
            results[0].content = decryptedContent;
            
            return res.json({ success: true, documents: results });
        });
    });
});

app.get('/documents_by_user', (req, res) => {
    let data = verificationAll(req,res);
    if (!data) {
        return res.redirect('/log');
    }
    connection.query( `SELECT documents.id,documents.title,documents.last_modified 
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
    let data = verificationAll(req,res);
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

app.post('/partage_document', (req, res) => {
    let data = verificationAll(req,res);
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
    let data = verificationAll(req,res);
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

app.get('/log', (req, res) => {
    res.sendFile('./public/html/log.html', { root: __dirname })
});

app.post('/register', async(req, res) => {
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

app.post('/login', async(req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    connection.query('SELECT * FROM users WHERE user_name = ?', [username], async(error, results) => {
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

app.get('/get_all_user_info', (req, res) => {
    let data = verificationAll(req,res);
    if (!data) {
        return res.redirect('/log');
    }
    connection.query('SELECT home_settings,style_settings FROM user_settings WHERE user_id_link = ?', [data.userID], async(error, results) => {
        if (error) {
            return res.json({ success: false, message: error.message });
        }

        if (results.length === 0) {
            return res.json({ success: true, data: data});
        }
        results[0].home_settings = JSON.parse(results[0].home_settings);
        results[0].style_settings = JSON.parse(results[0].style_settings);

        return res.json({ success: true, data: data, settings : results[0]});
    });
});
app.post('/save_user_settings', (req, res) => {
    let data = verificationAll(req,res);
    if (!data) {
        return res.redirect('/log');
    }
    const home_settings = JSON.stringify(req.body.home_settings);
    const style_settings = JSON.stringify(req.body.style_settings);
    connection.query('UPDATE user_settings SET home_settings = ?, style_settings = ? WHERE user_id_link = ? ',
        [home_settings, style_settings, data.userID], (error, results) => {
        if (error) {
            return res.json({ success: false, message: error.message });
        }

        return res.json({ success: true, message: 'Settings saved successfully' });
    });
});
app.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.clearCookie('secondaryKey');
    res.clearCookie('username');
    res.redirect('/log');
});


// app.listen(PORT, () => {
//     console.log(`Serveur démarré sur http://localhost:${PORT}`);
// });


function addKeyLinkToBase(user_id, key,iv,auth, id_doc) {
    connection.query('INSERT INTO key_link (user_id_link,document_id_link, encryptedData, iv, authTag) VALUES (?, ?, ?, ?, ?)',
        [user_id,id_doc, key, iv, auth], (error, _results) => {
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
    docKey += decipherKey.final('utf8');

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

        if (parsedMessage.type === 'info') {
            clents_status.set(clientId, parsedMessage.message);
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
        console.log(clents_status);

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
    });
});

server.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});