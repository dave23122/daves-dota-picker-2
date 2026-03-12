let heroesGrouped={}
let winrates={}
let heroMap={}

let yourTeam=[]
let enemyTeam=[]

let roleFilter=1
let alphabetFilter="*"
let scoreMode="winrate"
let baseWinrates={}

const heroGrid=document.getElementById("heroGrid")
const suggestions=document.getElementById("suggestions")

async function loadData(){

const heroResponse=await fetch("data/heroes.json")
heroesGrouped=await heroResponse.json()

const winrateResponse=await fetch("data/winrates.json")
winrates=await winrateResponse.json()

const baseResponse=await fetch("data/base_winrates.json")
baseWinrates=await baseResponse.json()

buildHeroMap()
createAlphabetFilter()
createGrid()
updateRoleButtons()
updateSuggestions()
document.getElementById("resetBtn").onclick=resetAll

document.querySelectorAll('input[name="scoreMode"]').forEach(r=>{
r.onchange=()=>{
scoreMode=r.value
updateSuggestions()
}
})

}

function buildHeroMap(){

for(const letter in heroesGrouped){

heroesGrouped[letter].forEach(hero=>{
heroMap[hero.hero_id]=hero
})

}

}

function heroImage(name){

return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${name}.png`

}

function createGrid(filter=""){

heroGrid.innerHTML=""

/* flatten hero list */

let heroList=[]

const letters=Object.keys(heroesGrouped).sort()

letters.forEach(letter=>{
heroesGrouped[letter].forEach(hero=>{
heroList.push(hero)
})
})

/* filter */

heroList=heroList.filter(hero => {

let matchesSearch =
hero.displayName.toLowerCase().includes(filter.toLowerCase())

let matchesLetter =
alphabetFilter==="*" ||
hero.displayName[0].toUpperCase()===alphabetFilter

return matchesSearch && matchesLetter

})

let lastLetter=""

/* create grid */

heroList.forEach(hero=>{

let div=document.createElement("div")
div.className="hero"
div.dataset.id=hero.hero_id

let img=document.createElement("img")
img.src=heroImage(hero.name)

div.appendChild(img)

addHeroTooltip(img, hero)

/* detect first hero of letter */

let firstLetter=hero.displayName[0].toUpperCase()

if(firstLetter!==lastLetter){

let letterLabel=document.createElement("div")
letterLabel.className="heroLetter"
letterLabel.innerText=firstLetter

div.appendChild(letterLabel)

lastLetter=firstLetter

}

/* click events */

div.onclick=()=>{
addHero(hero.hero_id,true)
document.getElementById("search").focus()
}

div.oncontextmenu=(e)=>{
e.preventDefault()
addHero(hero.hero_id,false)
document.getElementById("search").focus()
}

heroGrid.appendChild(div)

})

updateHeroStates()

}

function addHeroTooltip(element, hero){

element.addEventListener("mouseenter",(e)=>{

let tooltip=document.createElement("div")
tooltip.className="heroTooltip"

tooltip.innerHTML=hero.displayName

document.body.appendChild(tooltip)

let rect=e.target.getBoundingClientRect()

tooltip.style.left = e.clientX + 10 + "px";
tooltip.style.top = e.clientY - 10 + "px";

element.tooltip=tooltip

})

element.addEventListener("mouseleave",()=>{

if(element.tooltip){
element.tooltip.remove()
element.tooltip=null
}

})

}

function addHero(heroId,isAlly){

/* prevent hero being added to both teams */

if(yourTeam.includes(heroId) || enemyTeam.includes(heroId)){
return
}

if(isAlly){

if(yourTeam.length>=4) return
yourTeam.push(heroId)

}else{

if(enemyTeam.length>=5) return
enemyTeam.push(heroId)

}

updateTeams()
updateHeroStates()
updateSuggestions()

}

function updateTeams(){

const yourDiv=document.getElementById("yourTeam")
const enemyDiv=document.getElementById("enemyTeam")

yourDiv.innerHTML=""
enemyDiv.innerHTML=""

yourTeam.forEach(id=>{

let hero=heroMap[id]

let img=document.createElement("img")
img.src=heroImage(hero.name)

img.onclick=()=>removeHero(id)

yourDiv.appendChild(img)

})

enemyTeam.forEach(id=>{

let hero=heroMap[id]

let img=document.createElement("img")
img.src=heroImage(hero.name)

img.onclick=()=>removeHero(id)

enemyDiv.appendChild(img)

})

}

function removeHero(heroId){

yourTeam=yourTeam.filter(x=>x!==heroId)
enemyTeam=enemyTeam.filter(x=>x!==heroId)

updateTeams()
updateHeroStates()
updateSuggestions()

}

function updateHeroStates(){

document.querySelectorAll(".hero").forEach(el=>{

let id=parseInt(el.dataset.id)

el.classList.remove("ally","enemy","disabled")

if(yourTeam.includes(id)){

el.classList.add("ally","disabled")

}else if(enemyTeam.includes(id)){

el.classList.add("enemy","disabled")

}

})

}

function calculateScore(heroId){

let score=0
let count=0
let base=baseWinrates[heroId] || 0

enemyTeam.forEach(enemyId=>{
let entry=winrates[heroId]?.[enemyId]

if(entry && entry.vs!==undefined){

if(scoreMode==="winrate"){
score+=entry.vs
}
else{
score+=(entry.vs-base)
}

count++
}
})

yourTeam.forEach(allyId=>{
let entry=winrates[heroId]?.[allyId]

if(entry && entry.with!==undefined){

if(scoreMode==="winrate"){
score+=entry.with
}
else{
score+=(entry.with-base)
}

count++
}
})

if(count===0) return 0

return score
}

function updateSuggestions(){

suggestions.innerHTML=""

let available=Object.values(heroMap).filter(hero =>
!yourTeam.includes(hero.hero_id) &&
!enemyTeam.includes(hero.hero_id)
)

available=available.filter(hero =>
hero.roles.includes(roleFilter)
)

let scored=available.map(hero=>({

hero:hero,
score:calculateScore(hero.hero_id)

}))

scored.sort((a,b)=>b.score-a.score)

scored.slice(0,40).forEach(item=>{

let div=document.createElement("div")
div.className="suggestion"

let img=document.createElement("img")
img.src=heroImage(item.hero.name)

let scoreText=document.createElement("div")
scoreText.className="score"

let percent=(item.score*100).toFixed(1)

scoreText.innerText=percent+"%"

if(item.score>0)
scoreText.classList.add("pos")
else if(item.score<0)
scoreText.classList.add("neg")
else
scoreText.classList.add("zero")

div.appendChild(img)
div.appendChild(scoreText)

/* add tooltip */
addHeroTooltip(img, item.hero)

suggestions.appendChild(div)

})

}

document.getElementById("search").addEventListener("input",(e)=>{
createGrid(e.target.value)
})

document.getElementById("clearSearch").onclick=()=>{

let search=document.getElementById("search")

search.value=""
search.focus()

createGrid()

}

document.querySelectorAll(".roleBtn").forEach(btn=>{

btn.onclick=()=>{

roleFilter=parseInt(btn.dataset.role)

updateRoleButtons()
updateSuggestions()

}

})

function updateRoleButtons(){

document.querySelectorAll(".roleBtn").forEach(btn=>{

btn.classList.remove("active")

if(parseInt(btn.dataset.role)===roleFilter)
btn.classList.add("active")

})

}

function resetAll(){

yourTeam=[]
enemyTeam=[]

alphabetFilter="*"
roleFilter=1

document.getElementById("search").value=""

document.querySelectorAll(".alphaBtn")
.forEach(b=>b.classList.remove("active"))

document.querySelectorAll(".alphaBtn")
.forEach(b=>{
if(b.innerText==="*") b.classList.add("active")
})

document.querySelectorAll(".roleBtn")
.forEach(b=>b.classList.remove("active"))

document.querySelector('.roleBtn[data-role="1"]').classList.add("active")

updateTeams()
createGrid()
updateSuggestions()

}

function createAlphabetFilter(){

const container=document.getElementById("alphabetFilter")

const letters=["*"]

Object.keys(heroesGrouped)
.sort()
.forEach(l=>letters.push(l))

letters.forEach(letter=>{

let btn=document.createElement("span")

btn.className="alphaBtn"
btn.innerText=letter

if(letter==="*")
btn.classList.add("active")

btn.onclick=()=>{

alphabetFilter=letter

document.querySelectorAll(".alphaBtn")
.forEach(b=>b.classList.remove("active"))

btn.classList.add("active")

createGrid(document.getElementById("search").value)

}

container.appendChild(btn)

})

}

loadData()