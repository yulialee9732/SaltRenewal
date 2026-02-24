// Test price calculations for both 210만화소 and 500만화소

console.log('📊 Camera Price Calculator Test\n');
console.log('═'.repeat(70));

const priceMap210 = {
  2: 19000, 3: 23000, 4: 27000, 5: 33000, 6: 38000, 7: 43000, 8: 48000,
  9: 60000, 10: 65000, 11: 70000, 12: 74000, 13: 79000, 14: 83000,
  15: 89000, 16: 93000
};

const priceMap500 = {
  2: 21000, 3: 26000, 4: 33000, 5: 41000, 6: 47000, 7: 53000, 8: 59000,
  9: 72000, 10: 78000, 11: 84000, 12: 90000, 13: 96000, 14: 102000,
  15: 108000, 16: 114000
};

console.log('\n210만화소 vs 500만화소 Price Comparison:\n');
console.log('카메라 수 | 210만화소      | 500만화소      | 차이');
console.log('─'.repeat(70));

for (let i = 2; i <= 16; i++) {
  const price210 = priceMap210[i];
  const price500 = priceMap500[i];
  const diff = price500 - price210;
  console.log(
    `${i}대`.padEnd(10) + 
    `${price210.toLocaleString()}원`.padEnd(15) + 
    `${price500.toLocaleString()}원`.padEnd(15) + 
    `+${diff.toLocaleString()}원`
  );
}

console.log('\n═'.repeat(70));
console.log('\n💡 Features:');
console.log('   • 둘다 option: Shows both 210만화소 and 500만화소 prices');
console.log('   • >16 cameras: "16대 이상은 상담원에게 문의해 주세요"');
console.log('   • Default price used for 둘다: 210만화소 (when submitting)\n');
