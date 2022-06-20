const home = (req,res) => {
    res.status(200).json({
        success: true,
        message: 'hello from API'
    });
};






module.exports = {
    home
}