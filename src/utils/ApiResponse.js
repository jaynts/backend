class ApiResponse{
    constructor(statsCode, data, message="Success"){
        this.statsCode=statsCode;
        this.data=data;
        this.message=message;
        this.succes=statsCode<400;
    }
}