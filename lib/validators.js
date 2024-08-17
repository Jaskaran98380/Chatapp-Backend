import { body , param, validationResult , check} from "express-validator";
import { ErrorHandler } from "../utils/utility.js";

const registerValidator = ()=>[
    body("name" , "Please enter Name").notEmpty(),
    body("username" , "Please enter Username").notEmpty(),
    // body("password", "Password must be at least 8 characters long, and include at least one lowercase letter, one uppercase letter, one digit, and one special symbol.")
    // .notEmpty()
    // .isLength({ min: 8 }) // Minimum length
    // ?.matches(/(?=.*[a-z])/) // Lowercase letter
    // ?.matches(/(?=.*[A-Z])/) // Uppercase letter
    // ?.matches(/(?=.*\d)/) // Digit
    // ?.matches(/(?=.*[\W_])/), // Special symbol

    body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
    .matches(/(?=.*[a-z])/).withMessage('Password must include at least one lowercase letter')
    .matches(/(?=.*[A-Z])/).withMessage('Password must include at least one uppercase letter')
    .matches(/(?=.*\d)/).withMessage('Password must include at least one digit')
    .matches(/(?=.*[\W_])/).withMessage('Password must include at least one special symbol.'),

    body("bio" , "Please enter Bio").notEmpty()
    // check("avatar" , "Please provide Avatar").notEmpty()
]

const loginValidator = ()=>[
    body("username" , "Please enter Username").notEmpty(),
    body("password" , "Please enter Password").notEmpty()
]

const validateHandler = (req,res,next)=>{
    const errors = validationResult(req);
  console.log(errors , "err");
    const errorMessages = errors
      .array()
      .map((error) => error.msg)
      .join(", ");
  
    if (errors.isEmpty()) return next();
    else next(new ErrorHandler(errorMessages, 400));
}

const newGroupValidator = (req,res,next)=>[
    body("name" , "Please enter Name").notEmpty(),
    body("members").notEmpty().withMessage("Please enter members")
    .isArray({min:2 , max:100}).withMessage("Members must be between 3 and 100.")
]

const addMemberValidator = () => [
    body("chatId", "Please Enter Chat ID").notEmpty(),
    body("members")
      .notEmpty()
      .withMessage("Please Enter Members")
      .isArray({ min: 1, max: 97 })
      .withMessage("Members must be 1-97"),
  ];
  
  const removeMemberValidator = () => [
    body("chatId", "Please Enter Chat ID").notEmpty(),
    body("userId", "Please Enter User ID").notEmpty(),
  ];
  
  const sendAttachmentsValidator = () => [
    body("chatId", "Please Enter Chat ID").notEmpty(),
  ];
  
  
  const chatIdValidator = () => [
     // const chatIdValidator = () =>[param("id", "Please Enter Chat ID").notEmpty()];
    // const chatIdValidator = () =>[param('id').notEmpty().isInt().withMessage('ID is required')]
  ];

  const renameValidator = () => [
    // param("id", "Please Enter Chat ID").notEmpty(),

    // param('id')
    // .exists().withMessage('User ID is required') // Check if `id` exists
    // .isMongoId().withMessage('Invalid User ID format') ,// Validate if `id` is a valid MongoDB ObjectId
    body("name", "Please Enter New Name").notEmpty()
  ];

  const sendRequestValidator = ()=>[
    body("userId" , "Please Enter User ID.").notEmpty()
  ]

  const acceptRequestValidator = ()=>[
    body("requestId" , "Please Enter Request ID.").notEmpty(),
    body("accept")
    .notEmpty().withMessage("Please accept or Reject.")
    .isBoolean().withMessage("Accept or Reject should be Boolean.")
  ]

  const adminLoginValidator = ()=>[
    body("secretKey" , "Please Enter Secret Key").notEmpty()
  ]

export {registerValidator , validateHandler, loginValidator , newGroupValidator , addMemberValidator, removeMemberValidator, sendAttachmentsValidator, chatIdValidator, renameValidator, sendRequestValidator, acceptRequestValidator, adminLoginValidator}