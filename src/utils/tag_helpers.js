String.prototype.format = function () {
    var str = this;
    for (var i = 0; i < arguments.length; i++) {
        str = str.replace('{' + i + '}', arguments[i]);
    }
    return str;
};
/**
 * Normalize the volume string
 * 
 * @param  {string} volume extracted string with the volume (100ml or 2.7kg) 
 * @return {string} normalized volume (lowercase and no space)
 */
function normalize_vol(volume){
    let norm_vol = volume.toLowerCase();
    norm_vol = norm_vol.replace(/,/g,'.'); // replace comma with dot
    norm_vol = norm_vol.replace(/[ ]/g,''); // replace space with nothing
    if (norm_vol.endsWith('s') || norm_vol.endsWith('r')){
    norm_vol = norm_vol.substring(0,norm_vol.length-1);
    }
    return norm_vol;
}
const checksum = (number) => {
    const res = number
    .substr(0, 12)
    .split('')
    .map((n) => +n)
    .reduce((sum, a, idx) => (
        idx % 2 ? sum + a * 3 : sum + a
    ), 0);

    return (10 - (res % 10)) % 10;
}

function shift_array(array_, count){
    let result=[];
    for(let i=0;i<count;i++){
      let item = array_.shift();
      // css class to orient the price tag
      item["side"]="";
      // tag is rotated 90deg on the side
      if(i===4){
        item["side"]=" tag-side-top";
      }
      if(i===5){
        item["side"]=" tag-side-bottom";
      }
      result.push(item);
    }
    return result;
  }

function validBarcode(item) {
    let data = item.codebars;
    return (
    data.search(/^[0-9]{13}$/) !== -1 &&
    +data[12] === checksum(data)
    );
}

module.exports = {
/*
  Method to compute density price values EUR/kilo
  Return a map with price and the unit
*/
    compute_density: function(item, vol){
        let multiplier = {'c':100, 'm':1000, 'l':1, 'k':1, 'g':1000}
        let unit_conv = {'l': 'litre', 'cl':'litre', 'ml':'litre','kg':'kilo', 'g':'kilo'}
        //let mass_pattern = new RegExp('\\d{1,4}[.,]{0,1}\\d{0,4}[ ]*[mMkK]*[gG][rR]*');
        //let vol_pattern = new RegExp('\\d{1,4}[.,]{0,1}\\d{0,4}[ ]*[mMcC]*[lL][sS]*');
        
        if (!vol){
        return {"price":"999", "description":"N/A"};
        }
        
        let num = vol.match(/\d+[.]*\d*/g)[0];
        let unit = vol.match(/[a-z]+/g)[0];
        let mult = multiplier[unit[0]];
        let total_nb;
        total_nb = parseFloat(num);
    
        let pu_ttc = item.pu_ttc;
        let price = parseFloat(pu_ttc);
        price=parseFloat(pu_ttc)/(parseFloat(total_nb)/mult);
        return {"price":price.toFixed(2), "description":`${unit_conv[unit]}`}
  },

/**
 * Extract number of unit from the description.
 *
 * @param {Etiquette} item 
 * @returns {string} number of units sold.
 */
    compute_lot_string : function(item){
        let description = item.itemname;
        let nb_unit_pattern = new RegExp('[ ][xX][ ]*\\d{1,4}');
        let matched_pattern = description.match(nb_unit_pattern);
        if (matched_pattern) {
        let s = matched_pattern[0].toLowerCase().replace(/[ ]/g,'');
        return s.split("x")[1];
        }
        else{
        //return item.pcb_vente
        }
    },

    detect_volume_pattern: function(itemname){
        let mass_pattern = new RegExp('\\d{1,4}[.,]{0,1}\\d{0,4}[ ]*[mMkK]*[gG][rR]*');
        let vol_pattern = new RegExp('\\d{1,4}[.,]{0,1}\\d{0,4}[ ]*[mMcC]*[lL][sS]*');
    
        let vol;
        let desc = itemname;
        let m = desc.match(mass_pattern);
        if (m){ // if mass pattern is detected in description
        vol = normalize_vol(m[0]); // normalise_vol() if both for mass and volume
        }
        else{
        m = desc.match(vol_pattern); // if volume pattern is detected in description
        if (m){
            vol = normalize_vol(m[0]);
        }
        }
        return vol;
    },
    arrangeData: function (array_, count_by_page_){
        let count_by_page=count_by_page_;
        let array_size = array_.length;
        let pair = array_size % count_by_page;
        let grouped_size = Math.floor(array_size/count_by_page);
        let grouped=[];
        for(let i=0;i<grouped_size;i++){
            grouped.push(shift_array(array_,count_by_page))
        }
        if(pair!==0){
            grouped.push(shift_array(array_,pair))
        }
        return grouped;
    },

    noopData: function (array_){
        return array_;
    },

    /*Loop over an array and apply  an array of functions on each item*/
    loopOverArray: function (array_, functions){
            array_.forEach(function(item, index){
            functions.forEach(function(func){
                func(item, index)
            });
        });
    },
    addBarcodeType: function(item, index){
        let sapCodeRegex=/^[0-9]{1,6}$/;
        let codebarEan8Regex=/^[0-9]{1,8}$/;
        let codebar12Regex=/^[0-9]{1,12}$/;
        let cbtype='ean13';
        let cbcss='ean13';
        if(codebarEan8Regex.test(item.barcode)){
          cbtype='ean8';
          cbcss='ean8';
        }
        if(codebar12Regex.test(item.codebars)){
            cbtype='code128';
            cbcss='code1282';
        }
        if(sapCodeRegex.test(item.barcode)){
          cbtype='code128';
          cbcss='code128';
        }
        item.cbtype=cbtype;
        item.cbcss=cbcss;
        if(item.cbtype==='ean13'){
          if(!validBarcode(item)){
            item.cbtype='code128';
            item.cbcss='code1282';
          }
          //item.barcode = item.barcode.slice(0, -1);
        }
      
      },
}



