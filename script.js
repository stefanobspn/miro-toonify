import { encode } from 'https://esm.sh/@toon-format/toon';

async function init() {
    await miro.board.ui.on("icon:click", async () => {
        await miro.board.ui.openPanel({ url: "index.html" });
    });
}

function cleanHTMLElement(htmlString) {
    const doc = new DOMParser().parseFromString(htmlString, "text/html");
    return doc.body.textContent;
}

document.getElementById("btn-export").addEventListener("click", async () => {
    try {
        const selectedItems = await miro.board.getSelection();

        if (selectedItems.length === 0) {
            alert("Please select some sticky notes first!");
            return;
        }

        const stickyNotes = selectedItems.filter(item => item.type === "sticky_note");

        if (stickyNotes.length === 0) {
            alert("There are no sticky notes detected on your selection.");
            return;
        }

        const idMapping = new Map();
        let idCounter = 1;

        stickyNotes.forEach(note => {
            const shortId = `${idCounter++}`;
            idMapping.set(note.id, shortId);
        });

        const notesData = stickyNotes.map(note => ({
            id: idMapping.get(note.id),
            content: cleanHTMLElement(note.content),
            color: note.style?.fillColor || "none",
            in: [],
            out: []
        }));

        const notesMap = {};
        notesData.forEach(n => notesMap[n.id] = n);

        selectedItems
            .filter(item => item.type === "connector")
            .forEach(conn => {
                const fromId = idMapping.get(conn.start?.item);
                const toId = idMapping.get(conn.end?.item);

                if (fromId && toId && notesMap[fromId] && notesMap[toId]) {
                    notesMap[fromId].out.push(toId);
                    notesMap[toId].in.push(fromId);
                }
            });

        const finalData = {
            notes: notesData.map(n => ({
                id: n.id,
                content: n.content,
                color: n.color,
                in: n.in.join(","),
                out: n.out.join(",")
            }))
        };

        const finalExport = encode(finalData, { delimiter: '\t' });
        
        const txtResult = document.getElementById("txt-result");
        txtResult.value = finalExport;

        txtResult.select();
        txtResult.setSelectionRange(0, 99999);
    } catch (err) {
        alert("Error: " + err.message);
    }
});

init();