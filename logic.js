function isNoSupply( i ) {
	// no supply test
    if (i > 0 && data[i-1].vsa_tag === "UT" && data[i+1].close > data[i].close) {
      let current = data[i];
      let spread = current.high - current.low;
      let previous = data[i-1];
      let sum = 0;
      for (let j = i-9; j <= i; j++) {
        sum += data[j].close;
      }
      let sma = sum / 10;
      if (previous.close > sma && current.volume < current.volavg / 2 && current.atr < previous.atr / 3) {
        current.vsa_tag = "NS"; // no supply (bullish)
        return true;
      }
    }
    return false;
}
function isDumbMoney( i ) {
    // weakness (bearish) is evidence of supply
    if (i > 0) {
      let consecutiveBars = 0;
      let sumVolume = 0;
      let sumatr = 0;
      for (let j = i; j < data.length ; j++) {
        if (data[j].close > data[i-1].close && data[j].volume < data[j].volavg && data[j].atr < 1) {
          consecutiveBars++;
          sumVolume += data[j].volume;
          sumatr += data[j].atr;
        } else {
          break;
        }
      }
	 if (consecutiveBars > 2 && sumVolume/consecutiveBars < data[i].volavg && sumatr/consecutiveBars < 1) {
     for (let j = i; j < i + consecutiveBars; j++) {
        data[j].vsa_tag = "DM";
        // record supply area
        logic_control.supply_areas.push({
          volume: data[j].volume,
          time: data[j].time
        });
        }
        return consecutiveBars;
      }
    }
    return 0;
}
function isUpThrust(i) {
// upthrust
let consecutiveBars = 0;
for (let j = i + 1; j < data.length; j++) {
	if (data[j].atr > 0.9 && data[j].close > data[j-1].close) {
		data[j].vsa_tag = "UT";
		consecutiveBars++;
	} else break;
}
if(logic_control.current_range.high < data[i + consecutiveBars].close)
	logic_control.current_range.breakout = true;
else
	logic_control.current_range.breakout = false;
return consecutiveBars;
}
function isDownThrust(i) {
// downthrust
let consecutiveBars = 0;
for (let j = i + 1; j < data.length; j++) {
	if (data[j].atr > 0.9 && data[j].close < data[j-1].close) {
		data[j].vsa_tag = "DT";
		consecutiveBars++;
	} else break;
}
if(logic_control.current_range.low > data[i + consecutiveBars].close)
	logic_control.current_range.breakout = true;
else
	logic_control.current_range.breakout = false;
return consecutiveBars;
}
function generateVSA(data, logic_control) {
logic_control.current_range.lastbar = 0;
logic_control.current_range.breakout = false;
  for (let i = 0; i < data.length; i++) {
	//signs are checked in order of power/significance
    if (isNS(i)) continue;
    i += isDumbMoney(i);
    if(data[i].close > data[i+1].close)
   		i += isUpThrust(i);
	else
		i += isDownThrust(i);
	detectRangeBreak(i);
  }
}
function backToPrevRange(current_bar) {
	if(logic_control.price_ranges.length = 0) return false; //no ranges records exist
	if(logic_control.price_ranges[logic_control.price_ranges.length-1].low < current_bar.close
	&& current_bar.close < logic_control.price_ranges[logic_control.price_ranges.length-1].high) {
		//extend range
		if(logic_control.current_range.high < current_bar.high)  logic_control.current_range.high = current_bar.high;
		if(logic_control.current_range.low > current_bar.low)  logic_control.current_range.low = current_bar.low;
		logic_control.price_ranges.pop(); //roll back
		return true;
	}
	return false;
}
function detectRangeBreak(i) {
const hours = 3600*1000;
if(!logic_control.current_range.breakout) return;
if(data[i].time - data[logic_control.current_range.lastbar].time < 24*hours) return; //delay
  let closed = data[i].close;
  //check if 48 hours passed
  if (data[i].time - data[logic_control.current_range.start].time > 48*hours) {
	  // check if price is back into previous range
	  if( backToPrevRange(data[i]) ) return;
	  // check if current bar breaks range
	  if (closed > logic_control.current_range.high || closed < logic_control.current_range.low) {
	    // push current range to price_ranges
	    logic_control.price_ranges.push(logic_control.current_range);
	    // create new range
	    logic_control.current_range = {
	    	  start: i,
	      high: closed,
	      low: closed
	    };
	  }
  // update range high/low
  } else {
    if (closed > logic_control.current_range.high) logic_control.current_range.high = closed;
    else if (closed < logic_control.current_range.low) logic_control.current_range.low = closed;
    logic_control.current_range.lastbar = i;
  }
}
