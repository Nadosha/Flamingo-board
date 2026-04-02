import { Module } from "@nestjs/common";
import { CardsModule } from "../cards/cards.module";
import { AiService } from "./ai.service";
import { AiController } from "./ai.controller";

@Module({
  imports: [CardsModule],
  providers: [AiService],
  controllers: [AiController],
})
export class AiModule {}
