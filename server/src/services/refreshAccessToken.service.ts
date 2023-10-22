import axios from "axios";

const refreshAccessToken = async (currentRefreshToken:any,currentAccessToken:any) => {

    try {

      const response = await axios({
        method: 'post',
        url: 'https://discord.com/api/v10/oauth2/token',
        data: {
          grant_type: 'refresh_token',
          refresh_token: currentRefreshToken,
          client_id: process.env.CLIENT_ID,
          client_secret: process.env.CLIENT_SECRET,
        },
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
      });
    
      return response.data;
    } catch (error) {
      console.log(error);
      return {
        access_token: currentAccessToken,
        refresh_token: currentRefreshToken,
        token_type: 'Bearer'

      }
    }
  };

export default  refreshAccessToken