let heroesGrouped = {}
let winrates = {}

let heroMap = {}

let yourTeam = []
let enemyTeam = []

let roleFilter = null

const heroGrid = document.getElementById("heroGrid")
const suggestions = document.getElementById("suggestions")


async function loadData(){

const heroResponse = await fetch("data/heroes.json")
heroesGrouped = await heroResponse.json()

const winrateResponse = await fetch("data/winrates.json")
winrates = await winrateResponse.json()

buildHeroMap()

createGrid()

updateSuggestions()

}


function buildHeroMap(){

for(const letter in heroesGrouped){

heroesGrouped[letter].forEach(hero=>{
heroMap[hero.hero_id] = hero
})

}

}


function heroImage(name){

return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${name}.png`

}


function createGrid(filter=""){

heroGrid.innerHTML=""

for(const letter in heroesGrouped){

let heroes = heroesGrouped[letter]

let filtered = heroes.filter(hero =>
hero.displayName.toLowerCase().includes(filter.toLowerCase())
)

if(filtered.length === 0) continue

let label = document.createElement("div")
label.className="letter"
label.innerText = letter

heroGrid.appendChild(label)

filtered.forEach(hero=>{

let div = document.createElement("div")
div.className = "hero"
div.dataset.id = hero.hero_id

let img = document.createElement("img")
img.src = heroImage(hero.name)

div.appendChild(img)

div.onclick = () => addHero(hero.hero_id,true)

div.oncontextmenu = (e)=>{
e.preventDefault()
addHero(hero.hero_id,false)
}

heroGrid.appendChild(div)

})

}

updateDisabled()

}


function addHero(heroId,isAlly){

if(isAlly){

if(yourTeam.length >= 4) return

if(!yourTeam.includes(heroId))
yourTeam.push(heroId)

}else{

if(enemyTeam.length >= 5) return

if(!enemyTeam.includes(heroId))
enemyTeam.push(heroId)

}

updateTeams()
updateDisabled()
updateSuggestions()

}


function updateTeams(){

const yourDiv = document.getElementById("yourTeam")
const enemyDiv = document.getElementById("enemyTeam")

yourDiv.innerHTML=""
enemyDiv.innerHTML=""

yourTeam.forEach(heroId=>{

let hero = heroMap[heroId]

let img = document.createElement("img")
img.src = heroImage(hero.name)

img.onclick = () => removeHero(heroId)

yourDiv.appendChild(img)

})

enemyTeam.forEach(heroId=>{

let hero = heroMap[heroId]

let img = document.createElement("img")
img.src = heroImage(hero.name)

img.onclick = () => removeHero(heroId)

enemyDiv.appendChild(img)

})

}


function removeHero(heroId){

yourTeam = yourTeam.filter(h=>h!==heroId)
enemyTeam = enemyTeam.filter(h=>h!==heroId)

updateTeams()
updateDisabled()
updateSuggestions()

}


function updateDisabled(){

document.querySelectorAll(".hero").forEach(el=>{

let id = parseInt(el.dataset.id)

if(yourTeam.includes(id) || enemyTeam.includes(id))
el.classList.add("disabled")
else
el.classList.remove("disabled")

})

}


function calculateScore(heroId){

let score = 0
let count = 0

enemyTeam.forEach(enemyId=>{

let entry = winrates[heroId]?.[enemyId]

if(entry && entry.vs !== undefined){

score += entry.vs
count++

}

})

yourTeam.forEach(allyId=>{

let entry = winrates[heroId]?.[allyId]

if(entry && entry.with !== undefined){

score += entry.with
count++

}

})

if(count === 0) return 0

return score / count

}


function updateSuggestions(){

suggestions.innerHTML=""

let available = Object.values(heroMap).filter(hero =>
!yourTeam.includes(hero.hero_id) &&
!enemyTeam.includes(hero.hero_id)
)

if(roleFilter){

available = available.filter(hero =>
hero.roles.includes(roleFilter)
)

}

let scored = available.map(hero => ({

hero: hero,
score: calculateScore(hero.hero_id)

}))

scored.sort((a,b)=> b.score - a.score)

scored.slice(0,40).forEach(item=>{

let div = document.createElement("div")
div.className="suggestion"

let img = document.createElement("img")
img.src = heroImage(item.hero.name)

div.appendChild(img)

suggestions.appendChild(div)

})

}


document.getElementById("search").addEventListener("input",(e)=>{

createGrid(e.target.value)

})


document.querySelectorAll(".roleBtn").forEach(btn=>{

btn.onclick = ()=>{

let role = parseInt(btn.dataset.role)

if(roleFilter === role)
roleFilter = null
else
roleFilter = role

updateSuggestions()

}

})


loadData()