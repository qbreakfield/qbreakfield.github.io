window.MathJax = {
  tex: {
    inlineMath: {'[+]': [['@@', '@@']]}
  }
};

const data = JSON.parse(item_data);
let answerRevealed = false;
let desmosRevealed = false;
let correctAnswer = -1;
let questionIndex = 0;

let calculator;

function importQuestion(data, index) {
    console.log("TASK: Load...");
    answerRevealed = false;
    questionIndex = index;

    let unit = data[index].unit;
    let prompt = data[index].text;
    let choices = data[index].opts;
    let correct = parseInt(data[index].crct);
    correctAnswer = correct;
    let difficulty = parseInt(data[index].diff);
    let id = data[index].id;
    let img_name = data[index].img;
    let graph_state = data[index].graph;

    $('#q_unit').text(unit);
    $('#q_prompt').text(prompt);

    for(let i=0; i<4; i++) {
        $(`#chc${i+1}`).text(choices[i]);
        $(`#chc${i+1}`).removeClass("correct_choice");
    }

    for(let i=0; i<3; i++) {
        if(i < difficulty) {
            $(`#dft${i+1}`).addClass("i_filled");
        } else {
            $(`#dft${i+1}`).removeClass("i_filled");
        }
    }

    $('#i_id').text(`${id}`);

    if(img_name != null) {
        $('#i_diagram').attr('src', `content/${img_name}`);
    }

    if(graph_state != null) {
        calculator.setState(graph_state);
    } else {
        //$('#i_desmos').attr('disabled', true);
        calculator.setBlank();
    }
    $('#calculator').addClass("hidden");

    $('#i_toggle').removeClass("toggle_on");
    $('#i_toggle').addClass("toggle_off");
    $('#i_toggle').text("REVEAL");

    console.log("TASK: Load completed!");
}

$(document).ready(function() {
    let elt = document.getElementById('calculator');
    calculator = Desmos.GraphingCalculator(elt);

    $("#i_toggle").on("click", function() {

        if(questionIndex < 0 || questionIndex >= data.length) {
            console.error("Invalid question index.");
            return;
        }

        if(answerRevealed) {
            $('#i_toggle').removeClass("toggle_on");
            $('#i_toggle').addClass("toggle_off");
            $('#i_toggle').text("REVEAL");
            answerRevealed = false;

            $(`#chc${correctAnswer}`).removeClass("correct_choice");
            
        } else {
            $('#i_toggle').removeClass("toggle_off");
            $('#i_toggle').addClass("toggle_on");
            $('#i_toggle').text("HIDE");
            answerRevealed = true;

            $(`#chc${correctAnswer}`).addClass("correct_choice");

        }
    });

    $("#i_desmos").on("click", function() {
        console.log(JSON.stringify(calculator.getState()));
        if(desmosRevealed) {
            $('#i_diagram').removeClass("hidden");
            $('#calculator').addClass("hidden");
            desmosRevealed = false;
        } else {
            $('#i_diagram').addClass("hidden");
            $('#calculator').removeClass("hidden");
            desmosRevealed = true;
        }
    });

    importQuestion(data, 0);
});