import { Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { AccessTokenResponse } from './dto/AccessTokenResponse.dto';
import { JwtTokenAccess } from './dto/JwtTokenAccess.dto';
import { UserFromJwt } from './dto/UserFromJwt.dto';
import { UserPayload } from './dto/UserPayload.dto';
import { UpdateUserDto } from 'src/user/dto/update-user.dto';
import { UserDto } from 'src/user/dto/user.dto';
import { HttpService } from '@nestjs/axios';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { SignInUserDto } from './dto/SignInUser.dto';

@Injectable()
export class AuthService {

  logger = new Logger('AuthService');

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly httpService: HttpService
  ) { }

  /**
   * With the code received, make a request to intra service to get the access token.
   * Async function.
   *
   * @param code Code received from login with intra.
   * @returns Access token to get infos from intra.
   */
  async getToken(code: string): Promise<AccessTokenResponse> {
    const url = `${process.env['ACCESS_TOKEN_URI']}?grant_type=authorization_code&client_id=${process.env['CLIENT_ID']}&client_secret=${process.env['CLIENT_SECRET']}&redirect_uri=${process.env['REDIRECT_URI']}&code=${code}`;
    return (
      await this.httpService.axiosRef.post(url).then((res) => {
        return res.data as AccessTokenResponse;
      }).catch(() => {
        throw new InternalServerErrorException('getToken: Fail to request access token to intra!');
      })
    );

  }

  /**
   * With the data from jwt received, get the user from userService.
   *
   * @param data Data get from jwt extract.
   * @returns User data.
   */
  async getUserInfos(data: UserFromJwt): Promise<UserDto> {
    const userDto = await this.userService.getUserDTO(data.email);
    return (userDto);
  }

  async validateToken(userFromJwt: UserFromJwt) {
    const user = await this.userService.findUserByEmail(userFromJwt.email);
    return (user ? true : false);
  }

  /**
   * With the Access token received, make a request to intra to get the user data.
   * Async function
   *
   * @param token Access token received from intra.
   * @returns The data about the user received from intra.
   */
  async getDataFromIntra(token: string): Promise<UserDto> {

    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    const urlMe = `${process.env['URL_ME']}`;

    return (
      await this.httpService.axiosRef(urlMe, config).then(response => {
        return ({
          first_name: response.data.first_name,
          email: response.data.email,
          usual_full_name: response.data.usual_full_name,
          image_url: response.data.image.link,
          login: response.data.login,
          matches: response.data.matches,
          wins: response.data.wins,
          lose: response.data.lose,
          isTFAEnable: response.data.isTFAEnable,
          tfaValidated: response.data.tfaValidated,
          notify: [],
          friends: [],
          blocked: [],
          directs: [],
        });
      }).catch(err => {
        if (err.code == 'ERR_BAD_REQUEST')
          throw new UnauthorizedException('getData: Token invalid!');
        else
          throw new InternalServerErrorException('getData: Something is wrong!');
      })
    );

  }

  /**
   * Get the Access token from intra and get the infos about the user.
   * If the user exist in db the token saved will be updated,
   * otherwise a new user will be created on db.
   * Async function.
   *
   * @param code Code received from login with intra.
   * @returns Data received from intra.
   */
  async checkIfIsSignInOrSignUp(code: string): Promise<UserDto> {

    const token: AccessTokenResponse = await this.getToken(code);
    const data: UserDto = await this.getDataFromIntra(token.access_token);
    const user: User | null = await this.userService.findUserByEmail(data.email);

    if (!user) {
      await this.userService.createUser({
        email: data.email,
        imgUrl: data.image_url,
        first_name: data.first_name,
        usual_full_name: data.usual_full_name,
        nick: data.login,
        token: token.access_token,
        matches: '0',
        wins: '0',
        lose: '0',
        isIntra: true,
        password: ''
      });
      this.logger.log('user Created!');
    } else {
      const updateUserDto: UpdateUserDto = {
        tfaCode: undefined,
      };
      await this.userService.updateToken(data.email, token);
      this.logger.log('token updated!');
      await this.userService.updateUser(updateUserDto, user.email);
    }
    return (data);
  }

  /**
   * Create a user if doesn't exist. Other just login.
   * Create a jwt token and return to user.
   * Async function
   *
   * @param code Code received from login with intra.
   * @returns Jwt token access.
   */
  async signUpOrSignIn(code: string): Promise<JwtTokenAccess> {
    const data: UserDto = await this.checkIfIsSignInOrSignUp(code);
    const finalUser: User = await this.userService.findUserByEmail(data.email) as User;
    const payload: UserPayload = {
      email: finalUser.email,
      token: finalUser.token,
      tfaEmail: finalUser.tfaEmail as string,
      isIntra: true
    };

    return ({
      access_token: this.jwtService.sign(payload)
    });
  }

  
  async signInWithoutIntra(signInUserDto: SignInUserDto) {
    const user = await this.userService.findUserByEmail(signInUserDto.email);
    if (!user) {
      throw new UnauthorizedException('Incorrect e-mail or password!');
    }
    const isValidPassword = await user.checkPassword(signInUserDto.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Incorrect e-mail or password!');
    }
    if (user.isTFAEnable) {
      user.tfaValidated = false;
      try {
        user.save();
      } catch (error) {
        throw new InternalServerErrorException('Error to save tfa validate!');
      }
    }
    console.log('password is valid');
    const payload: UserPayload = {
      email: user.email,
      token: user.token,
      tfaEmail: user.tfaEmail as string,
      isIntra: false,
      password: user.password
    };

    return ({
      access_token: this.jwtService.sign(payload)
    });
  }

  async signUpWithoutIntra(createUserDto: CreateUserDto) {
    const user =  await this.userService.createUser(createUserDto);
    const payload: UserPayload = {
      email: user.email,
      token: user.token,
      tfaEmail: user.tfaEmail as string,
      isIntra: false,
      password: user.password
    };

    return ({
      access_token: this.jwtService.sign(payload)
    });
  }

  // Remove 
  async generateJwtToken(email: string): Promise<JwtTokenAccess> {
    const user = await this.userService.findUserByEmail(email);

    if (!user) {
      throw new NotFoundException('generateJwt: user not found!');
    }
    const payload: UserPayload = {
      email: user.email,
      tfaEmail: '',
      token: '',
      isIntra: true
    };

    return ({
      access_token: this.jwtService.sign(payload)
    });
  }

}
