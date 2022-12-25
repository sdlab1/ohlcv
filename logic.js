//code is generated https://chat.openai.com/chat/918d15b1-4f80-45b3-9457-65edd83f8a7b
//with some manual edit
//P.S. who is code owner?! funny. 
function isNoSupply( i ) {
	// no supply test
    if (i > 0 && data[i-1].vsa_tag === "UT" && data[i+1].close > data[i].close) {
      let current = data[i];
      let spread = current.high - current.low;
      let previous = data[i-1];
      let previousSpread = previous.high - previous.low;
      let sum = 0;
      for (let j = i-9; j <= i; j++) {
        sum += data[j].close;
      }
      let sma = sum / 10;
      if (previous.close > sma && current.volume < current.volavg / 2 && spread < previousSpread / 4) {
        current.vsa_tag = "NS"; // no supply (bullish)
        return true;
      }
    }
    return false;
}
function isDM( i ) {
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
return consecutiveBars;
}
function generateVSA(data, logic_control) {
  for (let i = 0; i < data.length; i++) {
    if (isNS(i)) continue;
    i += isDM(i);
    if(data[i].close > data[i+1].close)
   		i += isUpThrust(i);
	else
		i += isDownThrust(i);
  }
}
