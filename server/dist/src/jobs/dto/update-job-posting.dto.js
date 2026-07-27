"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateJobPostingDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_job_posting_dto_1 = require("./create-job-posting.dto");
class UpdateJobPostingDto extends (0, mapped_types_1.PartialType)(create_job_posting_dto_1.CreateJobPostingDto) {
}
exports.UpdateJobPostingDto = UpdateJobPostingDto;
//# sourceMappingURL=update-job-posting.dto.js.map