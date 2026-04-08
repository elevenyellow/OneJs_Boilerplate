import fs from 'fs'
import path from 'path'

export class AppGenerator {
  private readonly folderName: string
  private readonly basePath: string
  private readonly capitalizedName: string
  private readonly rootFolder: string

  constructor(folderName: string, basePath: string = 'src/apps') {
    this.folderName = folderName
    this.basePath = basePath
    this.capitalizedName = this.capitalize(folderName)
    this.rootFolder = path.join(basePath, folderName)
  }

  public generate(): void {
    this.createRootStructure()
    this.createService()
    this.createRepository()
    this.createEntity()
    this.createValueObject()
    this.createController()
    console.log('✅ Folder structure and files created successfully!')
  }

  private createRootStructure(): void {
    const structure = {
      domain: ['dtos', 'value-objects', 'entities'],
      infrastructure: ['controllers', 'persistance'],
      application: [],
    }

    this.ensureDirectory(this.rootFolder)
    for (const [folder, subfolders] of Object.entries(structure)) {
      const folderPath = path.join(this.rootFolder, folder)
      this.ensureDirectory(folderPath)

      subfolders.forEach((sub) => {
        this.ensureDirectory(path.join(folderPath, sub))
      })
    }
  }

  private createService(): void {
    const filePath = path.join(
      this.rootFolder,
      'application',
      `${this.folderName}.service.ts`,
    )
    const content = `
import { Injectable } from '@OneJs/core'

@Injectable()
export class ${this.capitalizedName}Service {
  constructor() {
    // Initialize service
  }

  public execute() {
    // Service logic
  }
}
`
    this.writeFile(filePath, content)
  }

  private createRepository(): void {
    const filePath = path.join(
      this.rootFolder,
      'infrastructure',
      'persistance',
      `${this.folderName}-mongo.repository.ts`,
    )
    const content = `
import { Injectable, MongoConnector } from '@OneJs/core'
import { Collection } from 'mongodb'
import { ${this.capitalizedName} } from '@${this.folderName}/domain/entities/${this.folderName}'

@Injectable()
export class ${this.capitalizedName}MongoRepository {
  private readonly collection: Collection<${this.capitalizedName}>

  constructor(private dbService: MongoConnector) {
    this.collection = this.dbService.collection('${this.folderName.toLowerCase()}')
  }

  public async save(entity: ${this.capitalizedName}) {
    await this.collection.updateOne({ id: entity.id.toString() }, { $set: entity.toDatabase() }, { upsert: true })
  }

  public async findOneById(id: Id) {
    const dto = await this.collection.findOne({ id: id.toString() })
    return dto ? ${this.capitalizedName}.fromDatabase(dto) : null
  }
}
`
    this.writeFile(filePath, content)
  }

  private createEntity(): void {
    const filePath = path.join(
      this.rootFolder,
      'domain',
      'entities',
      `${this.folderName}.ts`,
    )
    const content = `
import { Id } from '@${this.folderName}/domain/value-objects/id'

export class ${this.capitalizedName} {
  constructor(
    public readonly id: Id,
    // Add other properties here
  ) {}

  public toDatabase() {
    return {
      id: this.id.toString(),
      // Map other properties here
    }
  }

  public static fromDatabase(dto: any): ${this.capitalizedName} {
    return new ${this.capitalizedName}(Id.createFrom(dto.id) /* map other properties */)
  }
}
`
    this.writeFile(filePath, content)
  }

  private createValueObject(): void {
    const filePath = path.join(
      this.rootFolder,
      'domain',
      'value-objects',
      'id.ts',
    )
    const content = `
import { v4 as uuidv4 } from 'uuid'

export class Id {
  private readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  static generateUniqueId(): Id {
    return new Id(uuidv4())
  }

  static createFrom(id: string): Id {
    if (!this.isValidIdentifier(id)) {
      throw new Error('Invalid Id format')
    }
    return new Id(id)
  }

  private static isValidIdentifier(id: string): boolean {
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/
    return uuidRegex.test(id)
  }

  equals(other: Id): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
`
    this.writeFile(filePath, content)
  }

  private createController(): void {
    const filePath = path.join(
      this.rootFolder,
      'infrastructure',
      'controllers',
      `${this.folderName}.controller.ts`,
    )
    const content = `
import { Controller } from '@OneJs/core'
import { ${this.capitalizedName}Service } from '@${this.folderName}/application/${this.folderName}.service'
import { ${this.capitalizedName}MongoRepository } from '@${this.folderName}/infrastructure/persistance/${this.folderName}-mongo.repository'

@Controller('/${this.folderName.toLowerCase()}')
export class ${this.capitalizedName}Controller {
  constructor(
    private readonly service: ${this.capitalizedName}Service,
    private readonly repository: ${this.capitalizedName}MongoRepository,
  ) {}
}
`
    this.writeFile(filePath, content)
  }

  private ensureDirectory(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
      console.log(`📁 Created folder: ${dirPath}`)
    }
  }

  private writeFile(filePath: string, content: string): void {
    fs.writeFileSync(filePath, content.trimStart())
    console.log(`📄 Created file: ${filePath}`)
  }

  private capitalize(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1)
  }
}
