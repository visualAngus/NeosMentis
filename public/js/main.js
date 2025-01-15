import EditorJS from 'https://esm.sh/@editorjs/editorjs';
import Header from 'https://esm.sh/@editorjs/header';
import List from 'https://esm.sh/@editorjs/list';
import Paragraph from 'https://esm.sh/@editorjs/paragraph';
import AlignmentTool from 'https://cdn.jsdelivr.net/npm/editorjs-text-alignment-blocktune@1.0.3/+esm'
import editorjstable from 'https://cdn.jsdelivr.net/npm/@editorjs/table@2.4.3/+esm'
import editorjsunderline from 'https://cdn.jsdelivr.net/npm/@editorjs/underline@1.2.1/+esm'
import editorjslink from 'https://cdn.jsdelivr.net/npm/@editorjs/link@2.6.2/+esm'
import editorjsattaches from 'https://cdn.jsdelivr.net/npm/@editorjs/attaches@1.3.0/+esm'
import editorjsAlert from 'https://cdn.jsdelivr.net/npm/editorjs-alert@1.1.4/+esm'
import editorjsMath from 'https://cdn.jsdelivr.net/npm/editorjs-math@1.0.2/+esm'
import editorjsinlineCode from 'https://cdn.jsdelivr.net/npm/@editorjs/inline-code@1.5.1/+esm'
import rxpmeditorJsCode from 'https://cdn.jsdelivr.net/npm/@rxpm/editor-js-code@0.0.1/+esm'

var isload = false;

const editor = new EditorJS({
    holder: 'editorjs',
    tools: {
        header: {
            class: Header,
            tunes: ['alignment'], // Ajouter l'outil d'alignement ici
        },
        list: {
            class: List,
            inlineToolbar: true
        },
        paragraph: {
            class: Paragraph,
            inlineToolbar: true,
            tunes: ['alignment'], // Ajouter l'outil d'alignement ici aussi
        },
        table: editorjstable,
        underline: editorjsunderline,
        linkTool: {
            class: editorjslink,
            config: {
                endpoint: 'http://localhost:3000/fetch', // Your backend endpoint for url data fetching,
            }
        },
        attaches: {
            class: editorjsattaches,
            config: {
                endpoint: 'http://localhost:3000/uploadFile'
            }
        },
        alert: editorjsAlert,
        math: {
            class: editorjsMath, // for CDN: window.MathTex
        },
        inlineCode: {
            class: editorjsinlineCode,
            shortcut: 'CMD+SHIFT+M',
        },
        code: {
            class: rxpmeditorJsCode,
            config: {
                modes: {
                    'js': 'JavaScript',
                    'py': 'Python',
                    'go': 'Go',
                    'cpp': 'C++',
                    'cs': 'C#',
                    'md': 'Markdown',
                },
                defaultMode: 'go',
            },
        },
        alignment: {
            class: AlignmentTool,
            config: {
                default: "left", // L'alignement par défaut
                blocks: {
                    header: 'center', // L'alignement par défaut pour le header
                    list: 'right' // L'alignement par défaut pour la liste
                }
            }
        }
    },
    onReady: () => {
        console.log('Editor.js is ready to work!');
        document.querySelector('.load_div').style.opacity = '0';

        document.body.style.overflow = 'auto';
        setTimeout(() => {
            document.querySelector('.load_div').style.display = 'none';
            isload = true;
        }, 1000);
    },
    data: {},
});
document.getElementById('saveButton').addEventListener('click', () => {
    editor.save().then((outputData) => {
        let id = new URLSearchParams(window.location.search).get('id');

        console.log('Article data: ', outputData);
        editor.render(outputData);

        fetch('/save_document', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: JSON.stringify(outputData),
                id:id,
                title: document.querySelector('#title').value
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Document saved:', data.message);
            } else {
                console.error('Save failed:', data.message);
            }
        })


    }).catch((error) => {
        console.log('Saving failed: ', error);
    });
});

document.getElementById('shareButton').addEventListener('click', () => {
    let id = 3;
    fetch('/partage_document', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id_user:id,
            id_doc: new URLSearchParams(window.location.search).get('id')
        })
    })
    .then(response => response.text())
    .then(data => {
        console.log(data);
        if (data.success) {
            console.log('Document shared:', data.message);
        } else {
            console.error('Share failed:', data.message);
        }
    })
    .catch(error => console.error('Error:', error));
});


function loadDocument() {

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id')

    fetch('/documents', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id: id
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            let document_content = {};
            if (data.documents[0]['content']){
                console.log('Document loaded:', data.documents[0]['content']);
                document_content = JSON.parse(data.documents[0]['content']);
            }else{
            }
            const title = data.documents[0]['title'];
            editor.isReady.then(() => {
                if (document_content.blocks){
                    editor.render(document_content);
                }
                if (title != "New document"){
                    document.querySelector('#title').value = title;
                }
            });
        } else {
            console.error('Load failed:', data.message);
        }
    })
    .catch(error => console.error('Error:', error));
}

loadDocument();



/**
 * Modifie précisément un caractère dans le contenu de l'éditeur
 * @param {number} blockIndex - L'index du bloc à modifier.
 * @param {number} charIndex - La position du caractère à modifier dans le texte.
 * @param {string} char - Le caractère à insérer.
 */
async function modifyEditorText(blockId, newText) {
    try {
        // Récupérer le contenu actuel de l'éditeur
        const content = await editor.save();
        const blocks = content.blocks;
        let thereisselection = false;

        // Trouver le bloc avec l'ID spécifié
        const block = blocks.find(b => b.id === blockId);
        if (!block) {
            console.error('Bloc non trouvé.');
            return;
        }

        // Vérifier que le bloc est de type texte
        if (block.type !== 'paragraph' && block.type !== 'header') {
            console.error('Le bloc sélectionné n\'est pas de type texte.');
            return;
        }

        // Récupérer la position actuelle du curseur
        const selection = window.getSelection();
        if (selection.rangeCount !== 0) {
            thereisselection = true;
        }

        if (thereisselection){

            const range = selection.getRangeAt(0);
            const selectedNode = range.startContainer;

            // Vérifie que le curseur est dans le bloc spécifié
            const parentBlock = selectedNode.parentElement.closest('[data-id]');
            if (!parentBlock || parentBlock.getAttribute('data-id') !== blockId) {
                console.error('Le curseur n\'est pas dans le bloc ciblé.');
                return;
            }

            // Sauvegarder la position du curseur (offset)
            const cursorOffset = range.startOffset;

            // Mettre à jour le texte dans le bloc
            block.data.text = newText;
            await editor.blocks.update(blockId, block.data);

            // Attendre que le bloc soit recréé par Editor.js
            await new Promise(resolve => setTimeout(resolve, 100)); // Attente ajustable (100ms)

            // Repositionner le curseur à la bonne position
            const updatedBlock = document.querySelector(`[data-id="${blockId}"]`);
            if (updatedBlock) {
                const contentEditable = updatedBlock.querySelector('[contenteditable="true"]');
                if (contentEditable && contentEditable.firstChild) {
                    const textNode = contentEditable.firstChild;
                    const newOffset = Math.min(cursorOffset, textNode.textContent.length); // Ajuster l'offset si nécessaire

                    const newRange = document.createRange();
                    newRange.setStart(textNode, newOffset);
                    newRange.collapse(true);

                    selection.removeAllRanges();
                    selection.addRange(newRange);

                    console.log('Texte modifié et curseur repositionné avec succès.');
                } else {
                    console.error('Impossible de repositionner le curseur.');
                }
            }
        }
        else{
            // Mettre à jour le texte dans le bloc
            block.data.text = newText;
            await editor.blocks.update(blockId, block.data);
        }

    } catch (error) {
        console.error('Erreur lors de la modification du texte :', error);
    }
}



setTimeout(() => {
    console.log('Editor.js is not ready yet.');
    modifyEditorText("UMPHNj0Ner", 'Salut comment vas tu ???');
}, 5000);

// Exemple d'utilisation : Ajouter "A" à la position 5 du premier bloc

// Connecter au serveur WebSocket
const ws = new WebSocket('ws://localhost:3000');

// envoyer un message au serveur
ws.onopen = () => {
    console.log('Connexion établie.');
    ws.send(JSON.stringify({
        type: 'info',
        message: new URLSearchParams(window.location.search).get('id')
    }));
    console.log('Connexion établie 2.');
    ws.send(JSON.stringify({
        type: 'modification',
        doc: new URLSearchParams(window.location.search).get('id'),
        message: 'Je suis connecté.'
    }));
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'welcome') {
        console.log(`Mon ID est : ${data.clientId}`);
    } else if (data.type === 'notification') {
        console.log(`Notification reçue : ${data.message}`);
    }
};