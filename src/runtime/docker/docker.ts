/* eslint-disable @typescript-eslint/no-explicit-any */
import DockerClient, { ImageInfo } from 'dockerode'
import { logger } from '../../logger/logger'
import { RuntimeError } from '../runtime.error'
import { STATUS, TASK } from '../../interfaces/enginecore'
import { Streamlogger } from '../stream-logger'
export class DockerRuntime {
  private dockerInstance: DockerClient
  private static dockerSingleton: DockerRuntime
  private options: any
  private constructor() {
    this.dockerInstance = new DockerClient()
  }

  public static getInstance(): DockerRuntime {
    if (!this.dockerSingleton) {
      this.dockerSingleton = new DockerRuntime()
    }
    return this.dockerSingleton
  }

  public async testConnection(): Promise<any> {
    try {
      const dockerInfo = await this.dockerInstance.info()
      logger.info(`Docker runtime connection - SUCCESS`)
      return {
        id: dockerInfo.ID,
        name: dockerInfo.Name,
        version: dockerInfo.ServerVersion
      }
    } catch (error: any) {
      logger.error(`Docker runtime connection - FAILED`)
      throw new RuntimeError(error.message)
    }
  }

  public async createContainer(image: string, cmd: string, env: string[]): Promise<DockerClient.Container> {
    try {
      const container: DockerClient.Container = await this.dockerInstance.createContainer({
        Image: image,
        Cmd: ['/bin/bash', '-c', cmd],
        Env: env
      })
      logger.debug(`Docker container ID: ${container.id} , Image ID : ${image}`)
      return container
    } catch (error: any) {
      throw new RuntimeError(error.message)
    }
  }
  public async startContainer(container: DockerClient.Container): Promise<boolean> {
    try {
      logger.debug(`Docker container ID: ${container.id} started`)
      await container.start()
      return true
    } catch (error: any) {
      throw new RuntimeError(`Unable to start container with ID ${container.id} - ${error.message}`)
    }
  }
  public async stopContainer(container: DockerClient.Container): Promise<any> {
    await container.stop()
  }
  public async removeContainer(container: DockerClient.Container): Promise<any> {
    await container.remove({ force: true })
  }

  public async runTask(task: TASK): Promise<TASK> {
    try {
      const env =
        task.env != undefined && Object.keys(task.env).length > 0
          ? Object.entries(task.env).map(([key, value]) => `${key}=${value}`)
          : []

      const containerConfig = {
        image: task.image,
        env: env,
        cmd: task.script
      }

      await this.ensureImageExists(containerConfig.image)

      const container = await this.createContainer(containerConfig.image, containerConfig.cmd, containerConfig.env)
      await this.startContainer(container)
      const logStream = new Streamlogger(task.id)
      //Stream the logs
      const containerLogs = await container.logs({
        stdout: true,
        stderr: true,
        timestamps: true,
        follow: true
      })
      containerLogs
        .pipe(logStream)
        .on('end', () => {
          logStream.cleanup()
        })
        .on('error', (msg) => {
          logger.error(msg)
        })

      // wait for the container to finish
      const containerResult = await container.wait()
      if (containerResult.StatusCode != 0) {
        throw new RuntimeError(`Container execution FAILED - ${task.id}`)
      }
      task.state = STATUS.COMPLETED
      await this.removeContainer(container)
      return task
    } catch (error: any) {
      logger.error(`DockerRuntime Container execution FAILED - ${task.id}`)
      throw new RuntimeError(`Docker runtime error during running task - ${task.id} ${error?.message}`)
    }
  }

  private async checkImage(imageName: string): Promise<boolean> {
    try {
      const images: ImageInfo[] = await this.dockerInstance.listImages()
      return images.some((image) => image.RepoTags && image.RepoTags.includes(imageName))
    } catch (error: any) {
      throw new RuntimeError(`Failed to check image existence: ${error.message}`)
    }
  }

  private async ensureImageExists(imageName: string): Promise<void> {
    const imageExists = await this.checkImage(imageName)

    if (!imageExists) {
      logger.info(`Pulling image: ${imageName}`)
      const pullStream = await this.dockerInstance.pull(imageName)

      await new Promise((resolve, reject) => {
        this.dockerInstance.modem.followProgress(pullStream, (err: Error | null, result: any[]) => {
          if (err) reject(err)
          else resolve(result)
        })
      })

      logger.info(`Image ${imageName} pulled successfully`)
    }
  }
}
