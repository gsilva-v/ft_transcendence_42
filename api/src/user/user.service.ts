import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AccessTokenResponse } from 'src/auth/dto/AccessTokenResponse.dto';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { CredentialsDto } from './dto/credentials.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDto } from './dto/user.dto';
import * as fs from 'fs';
import { Notify } from '../notification/entities/notify.entity';
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>
  ) { }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const { email, imgUrl, first_name, usual_full_name, nick, token } =
      createUserDto;
    const user = new User();
    user.email = email;
    user.imgUrl = !imgUrl ? 'userDefault.png' : imgUrl;
    user.first_name = first_name;
    user.usual_full_name = usual_full_name;
    user.nick = nick;
    user.token = await bcrypt.hash(token, 10);
    user.matches = '0';
    user.wins = '0';
    user.lose = '0';
    try {
      await this.usersRepository.save(user);
      user.token = '';
      return user;
    } catch (error) {
      if (error.code.toString() === '23505') {
        throw new ConflictException('E-mail address already in use!');
      } else {
        throw new InternalServerErrorException(
          'createUser: Error to create a user!'
        );
      }
    }
  }

  async findUserByNick(nick: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: {
        nick,
      },
      relations: [
        'notify',
        'notify.user_source',
        'relations',
        'relations.passive_user',
      ]

    });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne(
      {
        where: {
          email,
        },
        relations: [
          'notify',
          'notify.user_source',
          'relations',
          'relations.passive_user',
        ]

      });
  }

  async findUserById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: {
        id,
      },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async checkDuplicateNick(nick: string): Promise<boolean> {
    const user = await this.usersRepository.findOne({
      where: {
        nick,
      },
    });
    if (user) return true;
    return false;
  }

  async updateToken(email: string, token: AccessTokenResponse) {
    const user = (await this.findUserByEmail(email)) as User;
    user.token = token.access_token;
    user.tfaValidated = false;
    try {
      user.save();
    } catch {
      throw new InternalServerErrorException(
        'UpdateToken: Error to update token!'
      );
    }
  }

  async getUsers(): Promise<User[]> {
    return await this.usersRepository.find({
      relations: [
        'notify',
        'relations',
      ]
    });
  }

  async getUserDTO(email: string): Promise<UserDto> {
    const user = (await this.findUserByEmail(email)) as User;
    const userDto: UserDto = {
      email: user.email,
      first_name: user.first_name,
      image_url: user.imgUrl,
      login: user.nick,
      usual_full_name: user.usual_full_name,
      matches: user.matches,
      wins: user.wins,
      lose: user.lose,
      isTFAEnable: user.isTFAEnable as boolean,
      tfaValidated: user.tfaValidated as boolean,
      notify: user.notify.map((notify) => {
        return {
          id: notify.id,
          type: notify.type,
          user_source: notify.user_source?.nick,
          additional_info: notify.additional_info,
          date: notify.date,
        };
      }),
      friends: user.relations.filter((rel) => rel.type === 'friend').map((rel) => {
        return {
          status: rel.type,
          login: rel.passive_user.nick,
          image_url: rel.passive_user.imgUrl,
        };
      }),
      blockeds: user.relations.filter((rel) => rel.type === 'blocked').map((rel) => {
        return {
          login: rel.passive_user.nick,
          image_url: rel.passive_user.imgUrl,
        };
      }),
    };

    return userDto;
  }

  async getUser(email: string): Promise<User> {
    const user = (await this.findUserByEmail(email)) as User;

    return user;
  }

  async checkCredentials(credentialsDto: CredentialsDto): Promise<User | null> {
    const { email, token } = credentialsDto;

    const user = await this.usersRepository.findOneBy({ email });
    if (user && (await user.checkToken(token))) {
      return user;
    } else {
      return null;
    }
  }

  async updateUser(updateUserDto: UpdateUserDto, email: string): Promise<User> {
    const user = (await this.findUserByEmail(email)) as User;
    const { nick, imgUrl, isTFAEnable, tfaEmail, tfaValidated, tfaCode } =
      updateUserDto;
    if (nick && (await this.checkDuplicateNick(nick)))
      throw new ForbiddenException('Duplicated nickname');

    user.nick = nick ? nick : user?.nick;
    user.imgUrl = imgUrl ? imgUrl : user?.imgUrl;
    user.isTFAEnable =
      isTFAEnable !== undefined ? isTFAEnable : user.isTFAEnable;
    user.tfaEmail = tfaEmail ? tfaEmail : user?.tfaEmail;
    user.tfaValidated =
      tfaValidated !== undefined ? tfaValidated : user.tfaValidated;
    user.tfaCode = tfaCode ? bcrypt.hashSync(tfaCode, 8) : user.tfaCode;
    if (nick) {
      if (user.imgUrl !== 'userDefault.png' && !user.imgUrl.includes('https://cdn.intra.42.fr')) {
        fs.rename(
          `../web/public/${user.imgUrl}`,
          `../web/public/${nick}_avatar.jpg`,
          function (err) {
            if (err) throw err;
          }
        );
        user.imgUrl = `${nick}_avatar.jpg`;
      }
    }

    if (tfaCode == null) {
      user.tfaCode = '';
    }

    try {
      await user.save();
      return user;
    } catch (error) {
      throw new InternalServerErrorException('Erro ao salvar os dados no db');
    }
  }


  async sendFriendRequest(user_email: string, user_target: string) {
    const user = await this.findUserByEmail(user_email);
    const friend = await this.findUserByNick(user_target);
    if (!friend || !user)
      throw new InternalServerErrorException('User not found in data base');
    if (user && friend && user.nick === friend.nick) {
      throw new BadRequestException('You cant add yourself');
    }

    const notify = new Notify();
    notify.type = 'friend';
    notify.user_source = user;
    notify.date = new Date(Date.now());
    if (friend.notify?.length === 0) {
      friend.notify = [];
    }
    friend.notify?.push(notify);

    try {
      friend.save();
    } catch (err) {
      console.log(err);
    }
  }

  async popNotification(email: string, id:string) {
    const user = await this.findUserByEmail(email) as User;

    user.notify = user.notify.filter((notify) => {
      if (notify.id == id)
        return ;
      return notify;
    });

    try {
      user.save();
      return;
    } catch (err) {
      throw new InternalServerErrorException('erro salvando notificacao');
    }
  }



}
