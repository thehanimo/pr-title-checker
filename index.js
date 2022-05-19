import * as core from '@actions/core'
import * as github from '@actions/github'

const separator = '--------------------------'
const urlTicket = 'https://support.apps.darva.com/browse/SINAPPSHAB-'
const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/')
const issue_number = github.context.issue.number
const { Octokit } = require('@octokit/action')
const octokit =new Octokit()
let JIRA_TICKETS = []
const firstbody=github.context.payload.pull_request.body
async function run() {
  try {
    const title = github.context.payload.pull_request.title
    const labels = github.context.payload.pull_request.labels
    const pattern = /\d{4,5}/
    const titleContainsJiraNumbers = pattern.test(title, 'i')
    const getJiraTicketsFromPrTitle = () => {
      JIRA_TICKETS = title.split('-')[0].split('|')
    }
    const buildCommentBody = (firstbody) => {
      const ticket= 'Tickets:'
      let tab=[]
      let urlWithSeparator=''
      JIRA_TICKETS.map((e)=> {
      tab.push('\r\n',urlTicket.concat(e))
      })

      if (firstbody==undefined){
        firstbody=''
      }
      else {
          if(firstbody && firstbody.toString().includes(urlTicket)){
            if(firstbody.toString().includes(separator)){
              firstbody = firstbody.split(separator)[1]
            }    
          }
          }
      urlWithSeparator=ticket.concat('\r\n',...tab).concat('\r\n', separator)
      return urlWithSeparator.concat('\r\n', firstbody)
    }
  
    if (titleContainsJiraNumbers) {
      getJiraTicketsFromPrTitle()
      const bd = buildCommentBody(firstbody)
      await createOrUpdateComment(bd)
      core.setOutput('JIRA_TICKETS', JIRA_TICKETS)
    } else {
      await addLabel('NotLinkedToJira')
      const splittedBody = firstbody.split(separator)
      const userdPrBody = splittedBody.length === 1 ? splittedBody[0] : splittedBody[1]
      core.info(userdPrBody)
      await createOrUpdateComment(userdPrBody)
      core.setOutput('JIRA_TICKETS', [])
    }
  } catch (error) {
    core.info(error)
  }
}

async function createOrUpdateComment(bd) {
  await octokit.rest.pulls.update({
    owner,
    repo,
    pull_number: issue_number,
    body:bd,
  })
}
async function addLabel(name) {
  let addLabelResponse = await octokit.issues.addLabels({
    owner,
    repo,
    issue_number,
    labels: [name],
  })
}
if (octokit) {
  run()
}