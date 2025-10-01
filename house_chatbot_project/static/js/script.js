let criteria = {};
let model = "";
let qIndex = 0;
let typingTimeout;

const questions = [
    {key:"Area", options:["Vallabh Vidyanagar","Anand City Center","Karamsad","Bakrol","Anand Outskirts","Gamdi"]},
    {key:"BuyRent", options:["Buy","Rent"]},
    {key:"PropertyType", options:["Flat","Bungalow","Duplex","Row House","Studio Apt.","Villa","Commercial Flat","Farmhouse"]},
    {key:"BHK", options:["1","2","3","4"]},
    {key:"CarpetArea", options:["<500","500-1000","1000-1500","1500-2000","2000+"]},
    {key:"NewResale", options:["New","Resale"]},
    {key:"Furnishing", options:["Unfurnished","Semi-Furnished","Furnished"]},
    {key:"PremiumFacilities", options:["Gym","Pool","Clubhouse","Lift","Security","Garden","Borewell","WiFi","Parking","24/7 Water Supply","Solar Power"]}
];

function startChat(selectedModel){
    model = selectedModel;
    criteria = {};
    qIndex = 0;
    addBotMessage(`Let's start! Select ${questions[qIndex].key}:`);
    showOptions(questions[qIndex].options, questions[qIndex].key);
}

function addBotMessage(text){
    const container = document.getElementById('chat-body');
    let msg = document.createElement('div');
    msg.className = 'bot-message fade-in';
    msg.innerHTML = '<span class="typing">Typing...</span>';
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(()=> { msg.innerHTML = text; container.scrollTop = container.scrollHeight; }, 500);
}

function addUserMessage(text){
    const container = document.getElementById('chat-body');
    let msg = document.createElement('div');
    msg.className = 'user-message fade-in';
    msg.innerHTML = text;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
}

function showOptions(options, key){
    const container = document.getElementById('chat-body');
    const wrapper = document.createElement('div');
    wrapper.className = 'options fade-in';
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.innerText = opt;
        btn.onclick = ()=>{
            if(key==="PremiumFacilities"){
                if(!criteria[key]) criteria[key]=[];
                if(criteria[key].includes(opt)){
                    criteria[key] = criteria[key].filter(o=>o!==opt);
                    btn.classList.remove('selected');
                }else{
                    criteria[key].push(opt);
                    btn.classList.add('selected');
                }
            }else{
                criteria[key]=opt;
                addUserMessage(opt);
                wrapper.remove();
                qIndex++;
                if(qIndex<questions.length){
                    addBotMessage(`Select ${questions[qIndex].key}:`);
                    showOptions(questions[qIndex].options, questions[qIndex].key);
                }else{
                    submitCriteria();
                }
            }
        };
        wrapper.appendChild(btn);
    });

    if(key==="PremiumFacilities"){
        const nextBtn = document.createElement('button');
        nextBtn.innerText="Next ✅";
        nextBtn.onclick=()=>{
            if(!criteria[key] || criteria[key].length===0){
                alert("Select at least one facility");
                return;
            }
            addUserMessage(criteria[key].join(", "));
            wrapper.remove();
            qIndex++;
            if(qIndex<questions.length){
                addBotMessage(`Select ${questions[qIndex].key}:`);
                showOptions(questions[qIndex].options, questions[qIndex].key);
            }else{
                submitCriteria();
            }
        };
        wrapper.appendChild(nextBtn);
    }

    container.appendChild(wrapper);
    container.scrollTop = container.scrollHeight;
}

function submitCriteria(){
    addBotMessage("Processing your request...");
    fetch('/chatbot',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({criteria:criteria, model:model})
    })
    .then(res=>res.json())
    .then(data=>{
        const container = document.getElementById('chat-body');
        let wrapper = document.createElement('div');
        wrapper.className = 'house-grid fade-in';
        wrapper.innerHTML = data.response;
        container.appendChild(wrapper);
        container.scrollTop = container.scrollHeight;
    });
}
