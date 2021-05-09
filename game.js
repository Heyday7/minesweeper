const width = document.getElementById('width')
const height = document.getElementById('height')
const numMine = document.getElementById('numMine')
const gameBoard = document.getElementById('gameBoard')
const startButton = document.getElementById('start')
const introduction = document.getElementById('beforeStart')
const restartButton = document.getElementById('restart')
const flagRemain = document.getElementById('flagRemain')
const timerText = document.getElementById('timer')

const gameResult = document.getElementById('gameResult')

let rows = []
let sec = 0
let onGame = false
let flag = 0
let resultText = ''

// restart 버튼의 click event에 설정된 조건으로 게임을 새롭게 시작하도록 바인딩한다.
restartButton.addEventListener('click', () => {
  initGame(width.value, height.value, numMine.value)
})

startButton.addEventListener('click', (e) => {
  if ((5 <= width.value && width.value <= 30) &&
    (5<= height.value && height.value <= 30) &&
    (0 <= numMine.value  && numMine.value <= width.value * height.value)) {
    introduction.className='hidden'
    initGame(width.value, height.value, numMine.value)
  } else {
    alert('조건에 맞춰 게임을 시작해주세요')
  }
}) 

const initGame = (width, height, numMine) => {
  rows = []
  onGame=true
  flag = numMine
  resultText = ''
  sec = 0

  gameBoard.innerHTML = ''  // Restart 시 초기화
  gameResult.innerHTML = resultText // Restart 시 초기화
  flagRemain.innerHTML = flag // Restart 시 초기화
  timerText.innerHTML = sec // Restart 시 초기화
  gameBoard.className = ''

  // 지뢰찾기 판 및 게임 만들기
  for (let i =0; i < height; i++) {
    const row = []
    const rowDom = document.createElement('div')
    rowDom.className='row';
    gameBoard.appendChild(rowDom)
       
    rows.push(row)
  
    for (let j=0; j < width; j++) {
      const blockDom = document.createElement('div')
      blockDom.className = 'block'
      rowDom.appendChild(blockDom)

      const block = {
        blockDom,
        x : j,
        y : i,
        isMine : false,
        clicked : false,
        flagged : false,
        // recursive click event handle을 위해 추가되었다.
        // 아래 click event 안에서 자세한 설명을 해두겠다.
        willClicked : false,       
      }
      
      row.push(block)

      // 좌 click event listener 작성
      blockDom.addEventListener('click', () => {
        click_handler(block);
      })

      // 우 click event listener 작성
      blockDom.addEventListener('contextmenu', (e) => {
        e.preventDefault()
        if (block.clicked) return;
        if (block.flagged) {
          block.flagged = false
          blockDom.classList.remove('flagged')
          flag += 1
        } else {
          block.flagged = true
          blockDom.classList.add('flagged')      
          flag -= 1
        }
        flagRemain.innerHTML = flag
      })
    }
  }

  // 무작위로 지뢰 배정!
  let n = 0
  while (n < numMine) {
    x = Math.floor(Math.random() * (width-1))
    y = Math.floor(Math.random() * (height-1))
    if (rows[y][x].isMine) continue
    else {
      rows[y][x].isMine = true
      n += 1
    }
  } 

  // 게임 플레이 시간 기록
  timer = setInterval(() => {
    sec += 1
    timerText.innerHTML = sec
  }, 1000)
  document.getElementById('inGame').className=''
}


// click 되었을 때의 동작을 실행시키는 handler function 이다.
const click_handler = (block) => {
  if (block.clicked || block.flagged) return;
  if (block.isMine) {
    block.blockDom.classList.add('mine')
    block.blockDom.classList.add('boom')
    return gameOver()
  }

  block.clicked = true
  block.blockDom.classList.add('clicked')

  const neighbors = getUnclickedNeighbors(block)
  const neighborsMineNum = neighbors.filter(neighbor => neighbor.isMine === true).length // 주변 8개 중의 지뢰 갯수
  
    // click event를 dispatch하기에 앞서서 forEach를 해서 주변 cell들의 willClicked
    // 를 true로 만들어준다. 그 이유는 forEach는 object 하나씩 돌아가는데
    // 이 경우 Depth-first 느낌이라서 깊게 들어갈수록 같은 셀에 대해서 엄청난 양의 재 클릭이 일어나
    // maximum call stack size를 초과할 수 있다. 따라서 이 if문을 통과하여 들어왔을 때에는 
    // 주변 neighbors들은 모두 clicked 될 거기 때문에 willclicked라는 변수로 이를 명시해준다.
  if (neighborsMineNum === 0 ) {
    neighbors.forEach(neighbor => neighbor.willClicked=true)
    neighbors.forEach((neighbor) => {
      click_handler(neighbor)
    })
  
  } else {
    block.blockDom.textContent = neighborsMineNum
    block.blockDom.classList.add('num' + neighborsMineNum)
  } 
  checkGameCleared()
}

// 한 block을 클릭했을 때 주변 8개의 block중 click 되거나, click이 예정된 bloack 을 제외한
// block들을 array 형태로 return 해준다.
const getUnclickedNeighbors = (block) => {
  const x = block.x
  const y = block.y
  const neighbors = []

  for (let i = Math.max(0, y-1); i <= Math.min(y+1, height.value-1); i++) {
    for (let j = Math.max(0, x-1); j <= Math.min(x+1, width.value-1); j++) {
      if (x===j && y===i) continue;
      if (rows[i][j].clicked || rows[i][j].willClicked) continue;
      else {
      neighbors.push(rows[i][j])
    }}
  }
  return neighbors
}


// 지뢰찾기 게임을 clear 했는지 확인하는 function
const checkGameCleared = () => {
  let n = 0
  rows.forEach((row) => {
    n += row.filter((block) => {
      return (block.isMine === false) && (block.clicked === true)
    }).length
  })

  if ((n === width.value * height.value - numMine.value) && onGame) {
    clearInterval(timer);
    alert(`성공!!, ${sec}초 만큼 걸렸습니다.`)
    resultText=`지뢰찾기 성공!!!!  ${sec}초 걸렸습니다. 다시 플레이 하려면 restart를 눌러주세요`
    gameResult.innerHTML = resultText
    gameBoard.classList.add('finished')
    onGame = false
    return
  }
}


// 지뢰를 밟았을 때 게임을 종료하기 위한 function
const gameOver = () => {
  clearInterval(timer);
  alert(`gameOver`)
  resultText='지뢰를 밟았습니다!!! 다시 플레이 하려면 restart를 눌러주세요'
  gameResult.innerHTML = resultText
  gameBoard.classList.add('finished')
  onGame = false  

  rows.forEach((row) => {
    row.forEach((block) => {
      if (block.isMine) {
        block.blockDom.classList.add('mine')
      }
    })
  })
}




