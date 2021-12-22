var tag_helpers = require('./tag_helpers');
var lodash = require('lodash');
var Papa = require("papaparse");
var moment = require('moment');

const defaultFilterFn = (item, first_field) => item[first_field].length>0 ;

function compute_volumic_price(item, index){
  let computed_lot=tag_helpers.compute_lot_string(item);
  let vol =tag_helpers.detect_volume_pattern(item.itemname);

  let nb_lot = item.nb_lot;
  if(item.nb_lot.length === 0){
    nb_lot= computed_lot;
    if(!nb_lot){
      nb_lot=item.pcb_vente;
    }
    item.nb_lot= nb_lot;
  }
  let density = tag_helpers.compute_density(item, vol);
  if(item.volumic_description.length===0){
    if(item.volumic_price.length===0){
      if(computed_lot){
        item.volumic_description="à l’unité";
        item.volumic_price=(parseFloat(item.pu_ttc)/parseFloat(item.nb_lot)).toFixed(2);
      }
      else {
        if(vol){
          item.volumic_price=density.price;
          item.volumic_description="au "+density.description;
        }
        else {
          item.volumic_price=item.pu_ttc;
          item.volumic_description="à l’unité";
        }
      }
    }
  }
  let pluriel="";
  if(item.pcb_achat > 1 || item.nb_lot>1){
    pluriel="s";
  }
  //et base_unit_word="bouteille";
  let base_unit_word="unité";
  if(item.pack_subdescription.length ===0){
    // Find a way to compute the pack_subdescription value
    //item.pack_subdescription = "(de "+item.pcb_achat+" lot"+pluriel+" de "+ item.nb_lot+ ")";
    let subdescription_base_word=base_unit_word;
    item.pack_subdescription = "(de "+item.pcb_achat+" "+subdescription_base_word+ pluriel+ ")";
  } else {
      let subdescription = item.pack_subdescription;
      if(subdescription.indexOf("{") !== -1){
        item.pack_subdescription = subdescription.format(item.pcb_achat, item.nb_lot);
      }
  }
  if(item.vendu.length===0){
    // Find a way to compute the vendu value
    item.vendu = "par lot de "+item.nb_lot+" "+base_unit_word+pluriel;
    if (item.pcb_vente === "1") {
      item.vendu = "à l’unité";
    }
  } else {
    let subdescription = item.vendu;
    if(subdescription.indexOf("{") !== -1){
      item.vendu = subdescription.format(item.nb_lot, item.pcb_achat);
    }
  }

}
/*
  Get the tag formatting configuration depending on the tag type among 
  ["RACK", "PROMO", "PALETTE", "SCAN"]
*/
function getTagConfiguration(tagType){
  // etiquette rack
  let tagRackConfig={
    typeData: {'count_by_page':6},
    pug_file: 'tagRack.pug',
    processData: tag_helpers.arrangeData,
    filterFn: (item, first_field) => (item[first_field].length>0 && item["onhand"]>0)
  };

  // etiquette promo
  let tagPromoConfig={
    typeData: {'count_by_page':2},
    pug_file: 'tagPromo.pug',
    processData: tag_helpers.arrangeData,
    filterFn: (item, first_field) => (item[first_field].length>0 && item["onhand"]>0)
  };

  // etiquette produit sans code barre
  let tagForScanConfig={
    typeData: {'count_by_page':1},
    pug_file: 'tagForScan.pug',
    processData: tag_helpers.arrangeData,
    filterFn: defaultFilterFn
  };

  // etiquette palette
  let tagPalletConfig={
    typeData: {'count_by_page':1},
    pug_file: 'tagPallet.pug',
    processData: tag_helpers.arrangeData,
    filterFn: defaultFilterFn
  }
  const tagTypes = ["RACK", "PROMO", "PALETTE", "SCAN"];
  const configs = [tagRackConfig, tagPromoConfig, tagPalletConfig, tagForScanConfig];
  const configAssociations = lodash.zipObject(tagTypes, configs);
  return configAssociations[tagType];
}

/** 
 * Process csv file to compute various fields and arrange data to 
 * render it in PUG templatting engine
 * 
*/
function processCsvFile(csvFileToProcess, tagType, config){
  return new Promise(function(resolve, reject){
    Papa.parse(csvFileToProcess, {
      header: true,
      error: (err, parsedFile) => reject(err, parsedFile),
      complete: function(parsedCsv, file){
       let first_field=parsedCsv.meta.fields[0];
       let parsedData=parsedCsv.data.filter(function(a){
         if(config.filterFn(a, first_field)){
           return a;
         }
       });
       let items = parsedData;
       let fnArray = [tag_helpers.addBarcodeType];
       if(tagType==="RACK"|| tagType==="PROMO") {
         fnArray.push(compute_volumic_price);
       }
       tag_helpers.loopOverArray(items, fnArray);
       if(tagType==="RACK"|| tagType==="PROMO"){
         items.forEach(function(item, index){
           item.start_promo=config.typeData.startdate;
           item.end_promo=config.typeData.enddate;
           item.text_size=item["description_size"];
           ["pu_ttc", "pu_ht", "ppack_ttc","ppack_ht","volumic_price"].map(function(prop){
             item[prop]=parseFloat(item[prop]).toFixed(2);
           })
         });
        }
        let processData = config.processData;
        let data = processData(items,config.typeData.count_by_page);
        resolve(data);
      }
    });
  });
}
const loadCsvFromFile = (csvFilepath) =>{
  return new Promise(function(resolve, reject){
    Papa.parse(csvFilepath, {
      header: true,
      delimiter:";",
      error: (err, parsedFile)=>reject(err, parsedFile),
      complete: function(parsedCsv, file){
        let first_field=parsedCsv.meta.fields[0];
        let parsedData=parsedCsv.data.filter(function(a){
          if(a[first_field].length>0){
            return a;
          }
        });
        resolve(parsedData);
      }
    });
  });
}

function loadCsv(props) {
  const { tagType, startDate, endDate, filePath } = props;
  let config = getTagConfiguration(tagType);
  config.typeData.startdate = moment(startDate).format("DD/MM");
  config.typeData.enddate = moment(endDate).format("DD/MM/YYYY");
  // Possible encodings: utf8, ucs2(for file from sap)
  return new Promise(function (resolve, reject) {
      processCsvFile(filePath, tagType, config)
      .then(
        data => resolve(data))
      .catch(e => reject(e));
  });
}

const helpers = {
  loadCsvFromFile : loadCsvFromFile,
  loadCsv : loadCsv
}

export default helpers;


