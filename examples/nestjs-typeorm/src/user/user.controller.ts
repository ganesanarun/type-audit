import {Body, Controller, Get, Logger, Param, ParseIntPipe, Post, Put} from '@nestjs/common';
import {UserService} from './user.service';
import {CreateUserDto, UpdateUserDto} from './dto/create-user.dto';

@Controller('users')
export class UserController {
    private readonly logger = new Logger(UserController.name);

    constructor(private readonly userService: UserService) {
    }

    @Post()
    async createUser(@Body() createUserDto: CreateUserDto) {
        this.logger.log(`Creating user: ${createUserDto.name} (${createUserDto.email})`);

        const startTime = Date.now();
        const user = await this.userService.createUserWithCompany(createUserDto);
        const duration = Date.now() - startTime;

        this.logger.log(`✅ User created successfully in ${duration}ms`, {
            userId: user.id,
            userName: user.name,
            companyId: user.company?.id,
            companyName: user.company?.name,
            duration
        });

        return {
            message: 'User and company created successfully with audit tracking',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                company: user.company ? {
                    id: user.company.id,
                    name: user.company.name,
                    industry: user.company.industry
                } : null
            }
        };
    }

    @Get()
    async findAll() {
        const users = await this.userService.findAll();
        return {
            message: 'Users retrieved successfully',
            users: users.map(user => ({
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                isActive: user.isActive,
                company: user.company ? {
                    id: user.company.id,
                    name: user.company.name,
                    industry: user.company.industry
                } : null,
                updatedAt: user.updatedAt
            }))
        };
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.findOne(id);
        return {
            message: 'User retrieved successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                isActive: user.isActive,
                company: user.company ? {
                    id: user.company.id,
                    name: user.company.name,
                    industry: user.company.industry
                } : null,
                updatedAt: user.updatedAt
            }
        };
    }

    @Put(':id')
    async updateUser(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateUserDto: UpdateUserDto
    ) {
        this.logger.log(`Updating user ${id}`, {updateData: updateUserDto});

        const startTime = Date.now();
        const user = await this.userService.updateUser(id, updateUserDto);
        const duration = Date.now() - startTime;

        this.logger.log(`✅ User ${id} updated successfully in ${duration}ms`, {
            userId: user.id,
            userName: user.name,
            duration
        });

        return {
            message: 'User updated successfully with audit tracking',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                isActive: user.isActive,
                updatedAt: user.updatedAt
            }
        };
    }
}