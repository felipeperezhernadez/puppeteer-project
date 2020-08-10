class TestResult {

    constructor(key, code, title, details){

        this.key = key
        this.code = code
        this.details = details
        this.title = title
    }
}

const OK = "OK"
const ERROR = "ERROR"
const WARNING = "WARNING"

class TestSet {

    constructor(){

        this.results = {}
        this.keys = []

        this.addResult = (result) => {

            if(!result)
                return

            this.results[result.key] = result;

            if(!this.keys.includes(result.key))
                this.keys.push(result.key)
        }

        this.printToConsole = () => {

            this.keys.forEach(k => {
                const result = this.results[k]
                
                if(!result) return
                
                var func = 'log'

                if(result.code === WARNING)
                    func = 'warn'
                else if(result.code === ERROR)
                    func = 'error'

                console[func](result.title)
                console[func]("-------------------")
                console[func](result.code)
                console[func](result.details)
                console[func]()
            })
        }
    }
}

exports.OK = OK
exports.ERROR = ERROR
exports.WARNING = WARNING
exports.TestResult = TestResult
exports.TestSet = TestSet