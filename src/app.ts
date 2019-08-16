import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
import {MongoClient, Collection, ObjectId} from "mongodb";

class App{
    private connection: MongoClient;
    private game_sessions: Collection;
    private app: express.Application;
    private port: number;

    constructor(port: number){
        this.port = port;
    }

    public async run(){
        await this.init();
        await this.app.listen(this.port);
    }

    private async init(){
        await this.initMongo();
        await this.initApp();
    }

    private async initMongo(){
        let connection = await MongoClient.connect("mongodb://database:27017/bull_and_cows")
            .catch(err => console.log(err));
        if(!connection){
            throw "Unable to create connection";
        }
        this.connection = connection;
        let db = await connection.db("bull_and_cows");
        this.game_sessions = db.collection("game_sessions");
    }

    private async initApp(){
        this.app = express();
        this.app.use(bodyParser.urlencoded({ extended: false }));
        this.app.use(bodyParser.json());
        this.app.use(session({
            secret: "secret",
            saveUninitialized: true,
            resave: true,
        }));
        this.app.get('/', function(req, res){
            res.sendFile("index.html", {root: "./dist/static"});
        });

        let self = this;
        this.app.post('/guess', async function(req, res){
            if(!req.session.gameId){
                req.session.gameId = await self.new_game_session();
            }
            let message = await self.game_session_guess(req.session, req.body.guess); 
            res.json({message: message});
        });
    }

    /**
     * Start new game session
     */
    private async new_game_session(): Promise<string>{
        // mongodb sets property _id after insert.
        // In order to get access to it `any`
        // used to surpass error.
        let data: any = {
            attempts: 0,
            value: genRandomNumber(),
        };
        await this.game_sessions.insertOne(data);
        return data._id;
    }

    /**
     * Query game session `id` with a guess and increment attempt count.
     * If guess was correct erase game session.
     */
    private async game_session_guess(session, guess: string): Promise<string>{
        if(!guess.match(/^[0-9]{4}$/)){
            return "You must enter 4 digit number";
        }
 
        let filterQuery = {_id: new ObjectId(session.gameId)};
        let updateQuery = {$inc: {"attempts": 1}}; // Increment `attempts` by one
        let res = await this.game_sessions.findOneAndUpdate(filterQuery, updateQuery);
        if(res.value.value === guess){
            await this.game_sessions.deleteOne(filterQuery);
            let attempts = res.value.attempts + 1;
            session.gameId = null;
            return `Correct! ${attempts} attempts.`
        }else{
            let res_message = processGuess(res.value.value, guess);
            return res_message;
        }
    }
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

new App(8080).run();
