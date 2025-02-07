const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_]).{6,}$/;
const emailRegex = /^(?:(?:(?:\w+[-+.]?)*\w+)|(?:"(?:[^"]|\\")*"))@(?:(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})$/;

export const DataValidation = ({ name, email, password }) => {
  const errors = [];

  if (!name || name.length < 3) {
    errors.push('Name must consist of at least 3 letters.');
  }

  if (!emailRegex.test(email)) {
    errors.push('Email is not valid.');
  }

  if (!passwordRegex.test(password)) {
    errors.push('Password must contain at least one uppercase letter, one lowercase letter, one special character, one number, and be at least 6 characters long.');
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
    };
  }

  return {
    valid: true,
    errors: [],
  };
};
export const PasswordValidation = ({password})=>{
  const errors  = []
  if (!passwordRegex.test(password)) {
    errors.push('Password must contain at least one uppercase letter, one lowercase letter, one special character, one number, and be at least 6 characters long.');
  }  
  if(errors.length > 0){
    return {
      valid:false,
      errors
    }
  }
  return {
    valid: true,
    errors: [],
  };
}
