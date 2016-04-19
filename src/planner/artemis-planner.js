export class Planner {

  constructor(settings) {
    this._settings = settings;
    this.plans = settings.plans;
  }

  findPlan(term){
     let plan = this.plans.find(pln => pln.type === "elm-type" && pln.value === term);
     return plan ? plan.plan : null;
  }

  static  isOneOfElements(wrd){
    return wrd.type === "elm-type";
  }

  plan(modeledQuery) {
    let jsonIncoming = modeledQuery;
    let plan = {
       "target": {
        "and": []
      }
    };

    let getLastInPlan = function() {
      return plan.target.and.length ?
        plan.target.and[plan.target.and.length-1] :
        null;
    };

    let isInsideRelation = function() {
      let last = getLastInPlan();
      return (last && last.scorer === 'rel-position');
    };

    let isRelation = function(word) {        
      return word.type === 'rel-position';
    };
    //replace all the '-' in the beginning 
    jsonIncoming.forEach(d=>{d.value = d.value.replace(/^-/,'')});

   // jsonIncoming =  [{value:"element"},{value:"left-of"},{value:"Button 2"}]
    jsonIncoming.forEach( word => {
      let relationPlan = {
        "scorer": "rel-position",
        "param": word.value,
        "weight": 1,
        "target": null
      };
      let freeTextPlan =  {
        "scorer": "free-text",
        "param": "",
        "weight": 1
      };
      let currPlan;
      if (Planner.isOneOfElements(word)) {
        currPlan = this.findPlan(word.value);
        if (isInsideRelation()) {
          //relation type
           getLastInPlan().target = currPlan;
        } else {
           plan.target.and.push(currPlan);
        }
      } else if (isRelation(word)) {
        //new relation
        plan.target.and.push(relationPlan);
      } else {
        freeTextPlan.param = word.value;
        currPlan =  freeTextPlan;
        if (isInsideRelation()) {
          //relation type
          getLastInPlan().target = currPlan;
        } else {
           plan.target.and.push(currPlan);
        }
      }
    });


    return plan;
  }

  __model_node(json) {
      return this.plans.find(x => x.type === json.type && x.value === json.value);
      console.error("settings doesn't contain plan for this string:",json);
  }
}
