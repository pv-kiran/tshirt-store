class Whereclause {
   constructor(base,query) {
      this.base = base,
      this.query = query
   }
   search() {
      const searchword = this.query.search ? {
        name: {
            $regex: this.query.search,
            $options: 'i'
        }
      } : {}

      this.base = this.base.find({...searchword});
      return this;
   }

   pagination(resultPerPage) {
      let current = 1;
      if(this.query.page) {
        current = this.query.page;
      }
      const skipVal = resultPerPage * (current - 1);
      this.base.limit(resultPerPage).skip(skipVal);
      return this;
   }


   filter() {
      const query = { ...this.query };
      delete query['search'];
      delete query['limit'];
      delete query['page'];
      // coverting query into a string
      let stringQuery = JSON.stringify(query);
      stringQuery = stringQuery.replace(/\b(gte|lte|gt|lt)\b/g ,m => `$${m}`)
      const jsonOfquery =  JSON.parse(stringQuery);
      this.base = this.base.find(jsonOfquery);
      return this
   }
}


module.exports = Whereclause;