let _=require('lodash');
let Papa = require('papaparse');
let fs = require('fs');
let zip=_.zip;

let multiplier = {'l':1, 'k':1, 'kg':1,
                'cl':100, 'g':1000, 'gr':1000, 'ml':1000,  'mg':1000};
let unit_conv = {'l': 'litre', 'cl':'litre', 'ml':'litre','kg':'kilo', 'g':'kilo', 'gr':'kilo'};
const dim3 = /\d{1,3}[.,]*\d{0,3}[xX+]\d{1,3}[.,]*\d{0,3}[xX]\d{1,3}[.,]*\d{0,3}/g;
const dimSand=/\d{1,3}\+\d{1,3}.{0,1}[xX]\d{1,3}/g;
const fraction=/\d{1,2}\/\d{1,2}/g
prixAuKilo=/\([pP]{0,1}\D*[kK][gG]{0,1}\s*°*.*\)/g;
metrage=/\d{1,3}[.,]*\d{0,3}([mMcC]{1,2})\b/g
degree=/\d{1,2}[.,]*\d{0,2}\s*°/g
litrage = /\d{1,3}([.,]*\d{1,4})*\s*(?<unit>[cCmM]{0,1}[lLsS]{1,2})\d*\b/g;
grammage = /\d{1,3}([.,]*\d{1,4})*\s*(?<unit>[kKgGrRsS]{1,3})\d*\b/g;
numberPattern = /\d{1,4}([,.]\d{1,4})*/g

validatedItems = [
    "CAFE ROYAL DOLCE G. EXPRESSO FORTE CAPSULES X 16",
    "TWIX 50GRS x 25",
    "FRITE 515 ALLUMETTES COUPE 6X6 X 2,5 KG",
    "DESPERADOS FUEGO PACK 8 X 3 X33CL",
    "EPONGE VEGET. BLONDE PAD X10 (97X78X30)  N°2",
    "DESPERADOS PACK 33CLX24 (5.9°)",
    "PLATEAU DE REGROUPEMENT 580x425x80mm PTR504",
    "SERVIETTES ELBE x200 30cm X 30 1P",
    "SAC CROISSANTS BLC N° 3 - 14+7X22CM X 500 PAROLE GDP",
    "POT KRAFT CARRE A PLAT CHAUD 8X7X10,5CM 780ML X 50",
    "GLACE ITALIENNE 5.5KG UHT FRAISE & LAIT (PRIX AU K°)",
    "NEMS POULET X 50 (1,65 KG)",
    "PUREE MOUSLINE MAGGI 8 X 130 GR (1,04 KG)",
    "SERVIETTES ECOLABEL 17X17CM MINI SERVIS 1 PLI X 200 NATUREL GDP",
    "SACHETS FRITES INGRAIS. BLC 12X12CM PAROLE X 1000 GDP",
    "HEINEKEN 5° XLN/CITIES  BLL 24 X 33 CL",
    "DODO 20 X 33 CL",
    "SAC SANDWICH BRUN DECORE (10+4)X31 X1000 FP",
];
items=[
    "DR PEPPER CAN. 33 CL x 24",
    "AJAX NETTOYANT 5 L",
    "AJAX VITRES TRIPLE ACTION 5 L",
    "COCA COLA 33 CL CAN x 24",
    "CREME LAVE MAIN BIDON 5 L ARBRE VERT",
    "L'ARBRE VERT LESSIVE LIQUIDE CONC. 5 L",
    "PAIC CITRON 5 L",
    "SKIP 1,7 L",
    "ASSIETTE PALMIER 120X120X30MM X 10",
];

/**
 * Normalize the volume string
 * 
 * @param  {string} volume extracted string with the volume (100ml or 2.7kg) 
 * @return {string} normalized volume (lowercase and no space)
 */
function normalize_vol(volume){
    let norm_vol = volume;
    if (norm_vol) {
        volume.toLowerCase();
        norm_vol = norm_vol.replace(/,/g,'.'); // replace comma with dot
        norm_vol = norm_vol.replace(/[ ]/g,''); // replace space with nothing
        if (norm_vol.endsWith('s') || norm_vol.endsWith('r')){
        norm_vol = norm_vol.substring(0,norm_vol.length-1);
        }
    }
    return norm_vol;
}

function analyseItem(name, patterns){
    let lowerName = name.toLowerCase();
    tokens = lowerName.split('x');
    return {analysis: patterns.map(p=>applyRegex(tokens, p)),
            nbX:tokens.length, sizeOfLegs: tokens.map(e=>e.length)};
}

function applyRegex(array, pattern) {
    return array.map(e=>e.matchAll(pattern)).map(e=>Array.from(e));
}
function applyOpArrayAsVector(array,op){
    return array.reduce((t,e)=>t.map((te, index)=>op(te, e[index])));
}
function isNearEdge(matchedPattern, isLeft){
    let indexElt = matchedPattern.index;
    let maxIndex = matchedPattern.input.length-1;
    let matchedElement = matchedPattern[0];
    let sizeElt = matchedElement.length;
    //console.log(`dist left: ${indexElt} // dist right: ${maxIndex-indexElt-sizeElt+1}`);
    return isLeft ? indexElt < 3 : (maxIndex-indexElt-sizeElt+1) < 3;
}

function chooseNbLotV2(result, nVector){
    let currentIndex = 0;
    let searching=true;
    let isLeft=true, isRight=false;
    if(result.length===1) return null;
    while (searching && currentIndex<result.length) {
        let element = result[currentIndex];
        if (element===0) {
            currentIndex = currentIndex + 1;
            continue;
        }
        const lot = nVector[currentIndex][0];
        let nearX = isNearEdge(lot, isLeft)||isNearEdge(lot,isRight);
        if (nearX){
            searching=false;
        } else {
            currentIndex=currentIndex+1;
        }
    }
    return currentIndex==result.length? null:nVector[currentIndex][0];
}

function cleanItemname(itemname){
    let patterns = [dim3,
                    degree,
                    dimSand,
                    /\b\d{1,2}[xX]\d{1,2}([cCmM]*)\b/g,
                    /[nN]\s{0,1}°\s{0,1}\d{1,3}/,
                    fraction,
                    grammage,
                    litrage];
    let item = patterns.reduce((t,e)=>t.replace(e,""),itemname);
    return item;
}

function testCompute(itemname){
    let item = cleanItemname(itemname);
    let {analysis} = analyseItem(item, [numberPattern, grammage, litrage, metrage]);
    let keys = ["n", "g", "l", "m"];
    let vectors=keys.reduce((acc, k, index)=>Object.assign(acc, {[k]:analysis[index]}),{});
    let sumUp = analysis.map(e=>e.map(e=>e.length));
    let result = applyOpArrayAsVector(sumUp,(a,b)=>a-b);
    let sumUpVols=keys.reduce((acc, k, i)=>Object.assign(acc, {[k]:sumUp[i]}),{});

    let vols = Object.entries(sumUpVols).map(([k,v])=>
                                        Object.assign({}, 
                                        {"unit":k, 
                                        "index":v.findIndex(e=>e>0)})
                                        );
    let vol = vols.slice(1).filter(({k,index})=>index>-1)[0];
    let nbLot = chooseNbLotV2(result, vectors["n"]);
    let volValue = vol ? normalize_vol(vectors[vol.unit][vol.index][0][0]):null
    let res = {"vol": volValue, "nbLot": nbLot?nbLot[0]:null};
    //console.log(`${item} : [${res.nbLot} : ${res.vol}]`);
    return res;
}


function loadCsv(filePath) {
    return new Promise(function (resolve, reject) {
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            // Parse local CSV file
            Papa.parse(data, {
                header: true,
                error: (err, parsedFile) => reject(err, parsedFile),
                complete: function (results) {
                    resolve(results);
                }
            });
        } catch (err) {
            reject(err);
        }
    });
}

function loadCsvAndAction(params, fn){
    loadCsv(params.filename)
    .then(results => {
        let accu=[];
        results.data.forEach(e=>{
            accu.push(fillItem(e));
        });
        let arrayObj = accu.reduce((array, m)=>{
            if(m) {
                return array.concat(Array.from(m.entries()).reduce((ac,kv)=>{
                    return Object.assign(ac,{[kv[0]]:kv[1]});
                },new Object()))
            } else return array

        },[]);
        var csv = Papa.unparse(arrayObj, {delimiter:";"});
        fs.writeFile(params.outputCsv, csv, function (err) {
            if (err) throw err;
            console.log('Saved!');
          }); 

    })
    .catch(err=>console.log(err))
}

function transformFromCopy(copied) {
    let transformed=copied.split(";").map(t=>`"${t}"`);
    return `[${transformed}]`;
}

headers = ["itemcode",
            "itemname",
            "pu_ht",
            "pcb_vente",
            "pcb_achat",
            "vendu",
            "nb_lot",
            "unite_vente",
            "pack_description",
            "pack_subdescription",
            "volumic_description",
            "volumic_price",
            "category"]

function computeVolPrice(price, volumeValue, volumeUnit){
    let mult = multiplier[volumeUnit];
    let conversion = parseFloat(volumeValue)/parseFloat(mult);
    let result = parseFloat(price)/conversion;
    return result.toFixed(2);
}
function processEmballageCategory(itemFields) {
    const f = ["nb_lot", "pu_ht", "pcb_vente"];
    let [nbLot, pu_ht, pcb_vente] = f.map(field=>parseFloat(itemFields.get(field)));
    let nbUnit = nbLot?nbLot:pcb_vente;
    let isPcbVenteNbLotEqual=parseFloat(nbUnit)===parseFloat(pcb_vente);
    let prix_a_lunite = isPcbVenteNbLotEqual ? pu_ht : pu_ht/nbUnit;
    let result = {"px_unite": prix_a_lunite.toFixed(3), "px_volum": null};
    return result;
}
function divideAsFloat(numerator, denominator){
    return parseFloat(numerator)/parseFloat(denominator);
}
function fillItem(item){
    if (item.itemname){
        let itemname = item.itemname;
        let fields = headers.reduce((acc,h)=>acc.set(h, item[h]),new Map());
        let res = testCompute(itemname);
        fields.set("nb_lot", res.nbLot);
        fields.set("vol", res.vol);
        //let pKilo = itemname.match(prixAuKilo);
        //
        let result={};

        if(fields.get("category")==="106") {
            result = processEmballageCategory(fields);
        }
        else {result = processItem(fields);}
        Object.entries(result).forEach(([k,v])=>fields.set(k,v));
        return fields;
    }
}

function processItem(item){
    const f = ["nb_lot","vol", "pu_ht", "pcb_vente"];
    let [nbLot, vol, pu_ht, pcb_vente] = f.map(field=>item.get(field));
    let conversion = 1;
    let prix_a_lunite=0; // soit pu_ht soit pu_ht/nbLot
    let prix_au_volume=0; // soit pu_ht quand prix kilo, soit pu_ht/volume
    let result = {};
    result["ratioNb"]=divideAsFloat(pcb_vente, nbLot);
    if(vol){
        let volumeValue=vol.match(/\d{1,3}\.{0,1}\d{0,2}/)[0];
        let volumeUnit=vol.match(/[a-z]{1,2}/)[0];
        let mult = multiplier[volumeUnit];
        conversion = divideAsFloat(volumeValue, mult);
        result["unit"]=unit_conv[volumeUnit];
        result["ratio"]=divideAsFloat(pcb_vente, conversion);
        if(nbLot){
            if(pcb_vente===nbLot){
                prix_a_lunite=pu_ht;
                if(volumeValue) prix_au_volume =computeVolPrice(pu_ht, volumeValue,volumeUnit);
            }
            else {
                if(result["ratioNb"]>3) {
                    prix_a_lunite = pu_ht
                    prix_au_volume = volumeValue?computeVolPrice(pu_ht, volumeValue,volumeUnit):null;
                } else {
                    prix_a_lunite = divideAsFloat(pu_ht, nbLot).toFixed(2);
                    prix_au_volume=divideAsFloat(pu_ht, nbLot*conversion).toFixed(2);
                }
            }
        }
        else { // nbLot is null case
            prix_a_lunite=pu_ht;
            if(parseFloat(pcb_vente) !== 1 && (parseFloat(conversion)===parseFloat(pcb_vente) || 
            (result["ratio"]>3 && result.ratio <11))
            ) {prix_au_volume=pu_ht}
            else {prix_au_volume=computeVolPrice(pu_ht, 
                                                 volumeValue,
                                                 volumeUnit)}
        }
    }
    result["px_unite"]=prix_a_lunite;
    result["px_volum"]=prix_au_volume;
    return result;
}