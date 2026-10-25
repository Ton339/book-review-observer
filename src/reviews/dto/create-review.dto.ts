import { IsNumber, IsString, IsNotEmpty, IsOptional, Min, Max } from 'class-validator';

export class CreateReviewDto {
    @IsNumber()
    @IsNotEmpty()
    bookId: number;

    @IsString()
    @IsNotEmpty()
    comment: string;

    @IsNumber()
    @IsNotEmpty()
    userId: number;

    @IsNumber()
    @IsOptional()
    @Min(1)
    @Max(5)
    rating?: number;
}