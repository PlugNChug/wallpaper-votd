import grabVerse from './verse'
import './styles/main.scss'
import HornPeak from './assets/HornPeak.jpg'

const mountainImg = document.getElementById('mountainImg')
mountainImg.src = HornPeak

console.log(grabVerse())
console.log("Finished!")