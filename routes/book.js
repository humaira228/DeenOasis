const router = require("express").Router();
const User = require("../models/user");
const jwt =require("jsonwebtoken");
const Book = require("../models/book");
const { authenticateToken } = require("./userAuth");
const { transliterate } = require("transliteration");


//add book-admin
router.post("/add-book",authenticateToken,async(req,res)=>{
    try{
        const {id}=req.headers;
        const user= await User.findById(id);
        if(user.role!=="admin"){
            return  res.status(400).json({message:"You don't have access to perform admin work"});
        }

        const book=new Book({
            url:req.body.url,
            title:req.body.title,
            author:req.body.author,
            price:req.body.price,
            desc:req.body.desc,
            language:req.body.language,

        });
        await book.save();
        res.status(200).json({message:"Books added Successfully"});


    }
    catch(error){
        res.status(500).json({message: "Internal Server Error"});
    }
});
//update book--admin
router.put("/update-book/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params; // Extract book ID from the URL

        // Check if the book exists and update it
        const updatedBook = await Book.findByIdAndUpdate(
            id,
            {
                url: req.body.url,
                title: req.body.title,
                author: req.body.author,
                price: req.body.price,
                desc: req.body.desc,
                language: req.body.language,
            },
            { new: true } // Return the updated document
        );

        if (!updatedBook) {
            return res.status(404).json({ message: "Book not found" });
        }

        res.status(200).json({ message: "Book updated successfully", data: updatedBook });
    } catch (error) {
        console.error("Error updating book:", error);
        res.status(500).json({ message: "An error occurred" });
    }
});


//delete book-admin
router.delete("/delete-book",authenticateToken,async(req,res)=>{
    try{
        const {bookid}=req.headers;
        await Book.findByIdAndDelete(bookid);
        return res.status(200).json({
            message:"Book Deleted Successfully",
        });
    }catch(error){
        console.log(error);
        return res.status(500).json({
            message:"An error Occurred",
        });

    }

});
//get all books---user
router.get("/get-all-books",async(req,res)=>{
    try{
        const books = await Book.find().sort({CreatedAt:-1});
        return res.json({
            Status:"Success",
            data:books,
        });
    }catch(error){
        console.log(error);
        return res.status(500).json({
            message:"An error Occurred",})
    }

});
//get recently added books limit 4---user
router.get("/get-recent-books",async(req,res)=>{
    try{
        const books = await Book.find().sort({CreatedAt:-1}).limit(4);
        return res.json({
            Status:"Success",
            data:books,
        });
    }catch(error){
        console.log(error);
        return res.status(500).json({
            message:"An error Occurred",})
    }

});
//get book by id---user
router.get("/get-book-by-id/:id",async(req,res)=>{
    try{
        const {id} = req.params;//can also use headers
        const book = await Book.findById(id);
        return res.json({
            Status:"Success",
            data:book,
        });
    }catch(error){
        console.log(error);
        return res.status(500).json({
            message:"An error Occurred",})
    }

});

// Search books by title, author, or language
// Search books by title, author, or language with exact matches first
router.get("/search-books", async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || !query.trim()) {
            return res.status(400).json({ status: "error", message: "Search query is required", data: [] });
        }

        const q = query.trim();
        const t = transliterate(q);

        console.log(`Original query: ${q}, Transliteration: ${t}`);

        // Build regexes
        const reQ = new RegExp(q, "i");
        const reT = new RegExp(t, "i");
        const reExactQ = new RegExp(`^${q}$`, "i");
        const reExactT = new RegExp(`^${t}$`, "i");

        // Aggregation pipeline for searching
        const books = await Book.aggregate([
            { 
                $match: {
                    $or: [
                        { title: { $regex: reQ } },
                        { author: { $regex: reQ } },
                        { language: { $regex: reQ } },
                        { title: { $regex: reT } },
                        { author: { $regex: reT } },
                    ]
                }
            },
            { 
                $addFields: {
                    score: {
                        $switch: {
                            branches: [
                                { case: { $regexMatch: { input: "$title", regex: reExactQ } }, then: 100 },
                                { case: { $regexMatch: { input: "$title", regex: reExactT } }, then: 90 },
                                { case: { $regexMatch: { input: "$author", regex: reExactQ } }, then: 80 },
                                { case: { $regexMatch: { input: "$author", regex: reExactT } }, then: 70 },
                                { case: { $regexMatch: { input: "$title", regex: reQ } }, then: 60 },
                                { case: { $regexMatch: { input: "$title", regex: reT } }, then: 50 },
                                { case: { $regexMatch: { input: "$author", regex: reQ } }, then: 40 },
                                { case: { $regexMatch: { input: "$author", regex: reT } }, then: 30 },
                                { case: { $regexMatch: { input: "$language", regex: reQ } }, then: 20 },
                            ],
                            default: 0
                        }
                    }
                }
            },
            { $sort: { score: -1, title: 1 } }
        ]);

        res.json({ status: "success", data: books });

    } catch (error) {
        console.error("Error searching books:", error);
        res.status(500).json({ status: "error", message: "Internal Server Error", data: [] });
    }
});

  module.exports = router;