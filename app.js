let heroesGrouped={}
let winrates={}
let heroMap={}

let yourTeam=[]
let enemyTeam=[]

let roleFilter=1

const heroGrid=document.getElementById("heroGrid")
const suggestions=document.getElementById("suggestions")

async function loadData(){

const heroResponse=await fetch("data/heroes.json")
heroesGrouped=await heroResponse.json()

const winrateResponse=await fetch("data/winrates.json")
winrates=await winrateResponse.json()

buildHeroMap()
createGrid()
updateRoleButtons()
updateSuggestions()

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

const letters=Object.keys(heroesGrouped).sort()

letters.forEach(letter=>{

const heroes=heroesGrouped[letter]

const filtered=heroes.filter(hero =>
hero.displayName.toLowerCase().includes(filter.toLowerCase())
)

if(filtered.length===0) return

let section=document.createElement("div")
section.className="letterSection"

let label=document.createElement("div")
label.className="letter"
label.innerText=letter

section.appendChild(label)

let heroList=document.createElement("div")
heroList.className="heroList"

filtered.forEach(hero=>{

let div=document.createElement("div")
div.className="hero"
div.dataset.id=hero.hero_id

let img=document.createElement("img")
img.src=heroImage(hero.name)

div.appendChild(img)

/* TOOLTIP */

div.addEventListener("mouseenter",(e)=>{

let tooltip=document.createElement("div")
tooltip.className="heroTooltip"

tooltip.innerHTML=
`${hero.displayName}<br>Role: ${hero.roles[0]} / ${hero.roles[1]}`

document.body.appendChild(tooltip)

let rect=e.target.getBoundingClientRect()

tooltip.style.left=(rect.left)+"px"
tooltip.style.top=(rect.top-35)+"px"

div.tooltip=tooltip

})

div.addEventListener("mouseleave",()=>{

if(div.tooltip){
div.tooltip.remove()
div.tooltip=null
}

})

div.onclick=()=>addHero(hero.hero_id,true)

div.oncontextmenu=(e)=>{
e.preventDefault()
addHero(hero.hero_id,false)
}

heroList.appendChild(div)

})

section.appendChild(heroList)

heroGrid.appendChild(section)

})

updateHeroStates()

}

function addHero(heroId,isAlly){

if(isAlly){

if(yourTeam.length>=4) return
if(!yourTeam.includes(heroId))
yourTeam.push(heroId)

}else{

if(enemyTeam.length>=5) return
if(!enemyTeam.includes(heroId))
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

enemyTeam.forEach(enemyId=>{

let entry=winrates[heroId]?.[enemyId]

if(entry && entry.vs!==undefined){
score+=entry.vs
count++
}

})

yourTeam.forEach(allyId=>{

let entry=winrates[heroId]?.[allyId]

if(entry && entry.with!==undefined){
score+=entry.with
count++
}

})

if(count===0) return 0

return score/count

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

suggestions.appendChild(div)

})

}

document.getElementById("search").addEventListener("input",(e)=>{
createGrid(e.target.value)
})

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

loadData()