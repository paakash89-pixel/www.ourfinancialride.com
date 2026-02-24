import { Module } from "@nestjs/common";
import { ProvidersService } from "./providers.service";
import { CompanySearchProvider } from "./company-search.provider";

@Module({
  providers: [ProvidersService, CompanySearchProvider],
  exports: [ProvidersService]
})
export class ProvidersModule {}
