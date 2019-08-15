import {createInterface} from "readline";

let readline = createInterface({
    input: process.stdin,
    output: process.stdout,
});

async function main(){
    console.log(`
    Welcome. App generated random 4 digit number.
    Your task is to guess it.
    Each guess attempt will provide you with additional
    information such as:
    
    + Every digit which was placed correctly will be marked with 'B'
    + Every digit which was not placed correctly, but present in 
        generated number will be marked as 'K'
    + Digits not present in generated number will be marked as '.'
    `);
    let num = genRandomNumber();
    let attempts = 0;
    let guessed = false;
    while(!guessed){
        let guess = await read_user_guess();
        attempts++;
        console.log(processGuess(num, guess));
        if(guess == num){
            guessed = true;
        }
    }
    console.log(`Guessed correctly. ${attempts} attempts.`);
    process.exit();
}

function processGuess(expected: string, guess: string): string{
    let res = "";
    for(let i=0; i<4; ++i){
        if(expected.charAt(i) == guess.charAt(i)){
            res += "B";
        }else if(expected.includes(guess.charAt(i))){
            res += "K";
        }else{
            res += ".";
        }
    }
    return res;
}

/**
 * Generate random 4 digit number
 *
 * Number represented as 4 character string which may 
 * start with zeroes ('0100', '0042', '0000')
 */
function genRandomNumber(): string{
    let num = Math.floor(Math.random() * 10000);
    // Convert to string padded with zeroes
    // to length of 4
    let num_str = ('0000' + num).slice(-4);
    return num_str;
}

async function read_user_guess(): Promise<string>{
    while(true){
        let line = await read_line("Your guess: ");
        if(!line.match("^[0-9]{4}$")){
            console.log("You must enter 4 digit number");
        }else{
            return line;
        }
    }
}

async function read_line(question: string): Promise<string>{
    return new Promise<string>(function(resolve, request){
        readline.question(question, resolve)
    });
}

main();
