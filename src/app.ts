import {Application, Request} from "express";
import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
import {MongoClient, Collection, ObjectId} from "mongodb";

interface Responce{
    message: string,
    kind: "err" | "win" | "info"
}

class App{
    private connection: MongoClient;
    private gameSessions: Collection;
    private app: Application;
    private port: number;

    constructor(port: number){
        this.port = port;
    }

    async run(){
        await this.init();
        await this.app.listen(this.port);
    }

    private async init(){
        await this.initMongo();
        await this.initApp();
    }

    private async initMongo(){
        const dbUri = process.env.MONGODB_URI || "mongodb://database:27017/bull_and_cows";
        const dbName = this.split_database_from_uri(dbUri);
        const connection = await MongoClient.connect(dbUri)
            .catch(err => console.log(err));
        if(!connection){
            throw new Error("Unable to create connection");
        }
        this.connection = connection;
        let db = await connection.db(dbName);
        this.gameSessions = db.collection("game_sessions");
    }

    private split_database_from_uri(uri: string): string{
        let arr = uri.split("/");
        return arr[arr.length-1];
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
        this.app.get('/', (req, res) => {
            res.sendFile("index.html", {root: "./dist/static"});
        });

        const self = this;
        this.app.post('/guess', async (req, res) => {
            let answer = await self.game_session_guess(req.session, req.body.guess);
            res.json(answer);
        });
    }

    /**
     * Query game session `id` with a guess and increment attempt count.
     * If guess was correct erase game session.
     */
    private async game_session_guess(session, guess: string): Promise<Responce>{
        if(!guess.match(/^[0-9]{4}$/)){
            return {message: "You must enter 4 digit number", kind: "err"};
        }
        if(!session.gameId){
            session.gameId = await this.new_game_session();
        }
 
        const filterQuery = {_id: new ObjectId(session.gameId)};
        const updateQuery = {$inc: {"attempts": 1}}; // Increment `attempts` by one
        const res = await this.gameSessions.findOneAndUpdate(filterQuery, updateQuery);
        if(!res.ok){
            // Invalid session was supplied
            session.gameId = null;
            return {message: "Invalid game session", kind: "err"};
        }

        if(res.value.value === guess){
            await this.gameSessions.deleteOne(filterQuery);
            const attempts = res.value.attempts + 1;
            session.gameId = null;
            return {message: `Correct! ${attempts} attempts.`, kind: "win"};
        }else{
            return {message: processGuess(res.value.value, guess), kind: "info"};
        }
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
        await this.gameSessions.insertOne(data);
        return data._id;
    }

}

function processGuess(expected: string, guess: string): string{
    let res = "";
    for(let i=0; i<4; ++i){
        if(expected.charAt(i) === guess.charAt(i)){
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
    const num = Math.floor(Math.random() * 10000);
    // Convert to string padded with zeroes
    // to length of 4
    const numStr = ('0000' + num).slice(-4);
    return numStr;
}

new App(Number(process.env.PORT) || 8080).run();
